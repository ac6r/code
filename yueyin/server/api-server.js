// 悦音本地后端网关，监听 3000（vite.config.js 里 /api 的代理目标）。
//
// 策略：真实 NeteaseCloudMusicApi 优先，失败自动回落到本地 mock。
//   - 真实 API 会作为子进程起在 3001 端口
//   - 每个请求先转发到 3001；连接失败 / 超时 / 5xx / 返回空数据时改用 mock
//   - 连续失败若干次后进入熔断，一段时间内直接走 mock，避免每个请求都干等超时
// 这样无论有没有网络、有没有装网易云 API，页面都不会再出现空白。
import http from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { existsSync } from 'node:fs'

import { GET_ROUTES, POST_ROUTES } from './mock/handlers.js'
import { makeCoverSvg } from './mock/data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT || 3000)
const REAL_PORT = Number(process.env.NCM_PORT || 3001)
const REAL_HOST = '127.0.0.1'

// 转发超时：超过就认为真实 API 不可用
const FORWARD_TIMEOUT = 8000
// 真实 API 返回 200 但数据是空的，也当成不可用（多半是未登录/被限流）
const EMPTY_TIMEOUT = 0

// 熔断：连续失败 N 次后，冷却期内不再尝试真实 API
const FAIL_THRESHOLD = 3
const COOLDOWN_MS = 30_000

const state = {
  realReady: false,
  lastError: '',
}

// 熔断按「接口路径」粒度记录：某个接口上游不可用（比如要登录才返回数据），
// 不应该拖累其他本来正常的接口。冷却期内该路径直接走 mock。
const failState = new Map()

function pathUsable(pathname) {
  const s = failState.get(pathname)
  return !s || Date.now() >= s.until
}

function noteFailure(pathname, reason) {
  state.lastError = reason
  const s = failState.get(pathname) || { fails: 0, until: 0 }
  s.fails++
  if (s.fails >= FAIL_THRESHOLD) {
    s.until = Date.now() + COOLDOWN_MS
    console.warn(`[gateway] ${pathname} 连续失败 ${s.fails} 次（${reason}），${COOLDOWN_MS / 1000}s 内改用 mock`)
  }
  failState.set(pathname, s)
}

function noteSuccess(pathname) {
  failState.delete(pathname)
}

// ---------------------------------------------------------------- 真实 API 子进程

// 设 MOCK_ONLY=1 可强制只用本地 mock 数据（离线演示 / 排查问题时用）
const MOCK_ONLY = process.env.MOCK_ONLY === '1'

function hasRealApi() {
  if (MOCK_ONLY) return false
  return existsSync(path.join(__dirname, '..', 'node_modules', 'NeteaseCloudMusicApi', 'server.js'))
}

let child = null

function startRealApi() {
  if (!hasRealApi()) {
    console.log('[gateway] 未安装 NeteaseCloudMusicApi，将只使用本地 mock 数据')
    console.log('[gateway] 如需真实数据：npm install -D NeteaseCloudMusicApi')
    return
  }

  child = spawn(process.execPath, [path.join(__dirname, 'netease.cjs')], {
    env: { ...process.env, NCM_PORT: String(REAL_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (d) => process.stdout.write(`[netease] ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`[netease] ${d}`))
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[gateway] 真实 API 进程退出 (code=${code})，后续请求走 mock`)
    }
    state.realReady = false
    child = null
  })

  // 轮询等待子进程就绪
  let tries = 0
  const timer = setInterval(async () => {
    tries++
    if (await pingReal()) {
      clearInterval(timer)
      state.realReady = true
      console.log('[gateway] 真实 API 已接管，转发目标 127.0.0.1:' + REAL_PORT)
    } else if (tries >= 15) {
      clearInterval(timer)
      console.warn('[gateway] 真实 API 启动超时，先用 mock 数据，随后会自动重试')
    }
  }, 800)
}

// 用 /toplist 探活
function pingReal() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: REAL_HOST, port: REAL_PORT, path: '/toplist', method: 'GET', timeout: 3000 },
      (res) => {
        res.resume()
        resolve(res.statusCode === 200)
      }
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
    req.end()
  })
}

function realUsable(pathname) {
  return state.realReady && child !== null && pathUsable(pathname)
}

// ---------------------------------------------------------------- 转发

// 注意：必须转发完整的 path + query（req.url），只传 pathname 会让上游收到
// 一个没有任何参数的请求（网易云绝大多数接口都靠 query 传参），从而返回 400。
function forward(target, method, headers, bodyBuf) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: REAL_HOST,
        port: REAL_PORT,
        path: target,
        method,
        timeout: FORWARD_TIMEOUT,
        headers: { ...headers, host: `${REAL_HOST}:${REAL_PORT}` },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(new Error('forward timeout')) })
    if (bodyBuf && bodyBuf.length) req.write(bodyBuf)
    req.end()
  })
}

// 真实 API 返回 200 但 payload 明显为空 => 视为不可用，交给 mock
// （网易云不少接口未登录时会返回 code:200 + 空数组）
const USEFUL_CHECKS = {
  '/banner': (j) => j.banners?.length,
  '/toplist': (j) => j.list?.length,
  '/toplist/detail': (j) => j.list?.length,
  '/top/playlist': (j) => j.playlists?.length,
  '/playlist/hot': (j) => j.tags?.length,
  '/playlist/catlist': (j) => j.sub?.length,
  '/playlist/detail': (j) => j.playlist,
  '/top/artists': (j) => j.artists?.length,
  '/top/album': (j) => j.monthData?.length,
  '/artist/list': (j) => j.artists?.length,
  '/artists': (j) => j.artist,
  '/artist/album': (j) => j.hotAlbums?.length,
  '/artist/mv': (j) => j.mvs?.length,
  '/artist/desc': (j) => j.briefDesc,
  '/album': (j) => j.album,
  '/song/detail': (j) => j.songs?.length,
  '/simi/song': (j) => j.songs?.length,
  '/simi/playlist': (j) => j.playlists?.length,
  '/simi/mv': (j) => j.mvs?.length,
  '/mv/all': (j) => j.data?.length,
  '/mv/detail': (j) => j.data,
  '/mv/url': (j) => j.data?.url,
  '/dj/hot': (j) => j.djRadios?.length,
  '/dj/detail': (j) => j.data,
  '/dj/program': (j) => j.programs?.length,
  '/lyric': (j) => j.lrc,
  '/search/hot': (j) => j.result?.hots?.length,
  '/search/suggest': (j) => j.result?.order?.length,
  // 搜索无结果时真实接口也会返回 code 200 + 空数组，这里只要 result 存在就放行，
  // 空结果由页面自己展示「没有找到」而不是回落 mock
  '/cloudsearch': (j) => j.result,
  '/user/playlist': (j) => j.playlist?.length,
  '/user/detail': (j) => j.profile,
  '/comment/playlist': (j) => j.comments?.length,
  '/related/playlist': (j) => j.playlists?.length,
  '/playlist/subscribers': (j) => j.subscribers?.length,
}

function isUseful(pathname, json) {
  const check = USEFUL_CHECKS[pathname]
  if (!check) return true // 写操作等没有校验规则，只要 200 就算成功
  try { return Boolean(check(json)) } catch { return false }
}

// ---------------------------------------------------------------- mock

function runMock(pathname, method, query, body, res) {
  const table = method === 'POST' ? POST_ROUTES : GET_ROUTES
  // POST 也允许命中 GET 表（有接口同路径不同方法）
  const handler = table[pathname] || (method === 'POST' ? GET_ROUTES[pathname] : undefined)

  if (!handler) {
    // 认识的路径不够全时，返回一个"空但合法"的响应，避免前端 502
    return sendJson(res, 200, { code: 200, mock: true, note: `no mock handler for ${pathname}` })
  }

  try {
    const out = handler({ query, body })
    if (!out) return sendJson(res, 200, { code: 200, mock: true })
    return sendJson(res, out.status || 200, out.json)
  } catch (err) {
    console.error(`[gateway] mock 处理 ${pathname} 出错:`, err.message)
    return sendJson(res, 200, { code: 200, mock: true, error: err.message })
  }
}

function sendJson(res, status, json) {
  const buf = Buffer.from(JSON.stringify(json))
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
  })
  res.end(buf)
}

// 本地占位图：/mock-img/<kind>/<id>.svg
function serveMockImage(pathname, res) {
  const m = pathname.match(/^\/mock-img\/([a-z]+)\/(\d+)\.svg$/)
  if (!m) return false
  const [, kind, id] = m
  const isAvatar = kind === 'user' || kind === 'artist'
  const svg = makeCoverSvg(kind, id, isAvatar ? 'circle' : 'square')
  res.writeHead(200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    // 占位图很小且按 id 确定性生成，短缓存即可；
    // 缓存太久会导致改了 mock 数据后浏览器还显示旧图。
    'Cache-Control': 'public, max-age=60',
  })
  res.end(svg)
  return true
}

// ---------------------------------------------------------------- 服务器

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname
  const query = Object.fromEntries(url.searchParams)

  // 占位图直接本地生成，不经过真实 API
  if (serveMockImage(pathname, res)) return

  // 读 body（POST /song/detail 需要原样转发）
  const chunks = []
  for await (const c of req) chunks.push(c)
  const bodyBuf = Buffer.concat(chunks)

  if (realUsable(pathname)) {
    try {
      // 带上 query，否则上游收到的请求没有参数
      const out = await forward(req.url, req.method, req.headers, bodyBuf)

      if (out.status >= 500) {
        noteFailure(pathname, `upstream ${out.status}`)
        return runMock(pathname, req.method, query, bodyBuf.toString(), res)
      }

      // 上游出错时会返回非 JSON 或畸形 JSON（例如重复拼接的 {"code":400}），
      // 这类响应直接回落到 mock，不要把坏数据透给前端。
      let json = null
      try { json = JSON.parse(out.body.toString()) } catch { /* 见下 */ }

      if (!json) {
        noteFailure(pathname, 'malformed json')
        return runMock(pathname, req.method, query, bodyBuf.toString(), res)
      }

      if (!isUseful(pathname, json)) {
        noteFailure(pathname, 'empty payload')
        return runMock(pathname, req.method, query, bodyBuf.toString(), res)
      }

      noteSuccess(pathname)
      res.writeHead(out.status, {
        'Content-Type': out.headers['content-type'] || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      return res.end(out.body)
    } catch (err) {
      noteFailure(pathname, err.message)
      // 落到下面的 mock
    }
  }

  return runMock(pathname, req.method, query, bodyBuf.toString(), res)
})

server.listen(PORT, () => {
  console.log('')
  console.log(`  悦音 API 网关  http://localhost:${PORT}`)
  console.log(`  ├─ 真实网易云 API：${MOCK_ONLY ? '已禁用（MOCK_ONLY=1）' : hasRealApi() ? '已安装，正在启动…' : '未安装（仅 mock）'}`)
  console.log(`  └─ 本地 mock 数据：已加载 ${GET_ROUTES && Object.keys(GET_ROUTES).length} 个接口`)
  console.log('')
  startRealApi()
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (child) child.kill()
    process.exit(0)
  })
}
