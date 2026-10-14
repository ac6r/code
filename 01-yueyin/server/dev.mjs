// npm run dev 的入口：同时拉起「API 网关」和「vite 开发服务器」。
//
// 这样只跑一条命令就能得到完整环境——之前需要手动另开一个终端启动后端，
// 忘了启动就会出现接口全 502、页面一片空白的情况。
import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const children = []
let shuttingDown = false

function run(label, args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })

  const prefix = `[${label}] `
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) out.write(prefix + line + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)

  child.on('exit', (code) => {
    if (shuttingDown) return
    console.error(`${prefix}进程退出 (code=${code})，正在关闭其余进程`)
    shutdown(code ?? 1)
  })

  children.push(child)
  return child
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const c of children) {
    if (!c.killed) c.kill()
  }
  setTimeout(() => process.exit(code), 300)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

// 探活：端口上已经有服务在跑就复用，避免 EADDRINUSE 把整个开发环境带崩
// （关掉终端时子进程常常残留，重复 npm run dev 就会撞端口）
function ping(port, pathname = '/') {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname, timeout: 1500 }, (res) => {
      res.resume()
      resolve(res.statusCode > 0)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

const API_PORT = Number(process.env.PORT || 3000)
const VITE_PORT = 9999

const apiUp = await ping(API_PORT, '/toplist')
const viteUp = await ping(VITE_PORT, '/')

if (apiUp && viteUp) {
  console.log(`检测到开发环境已经在运行（网关 ${API_PORT} + vite ${VITE_PORT}），无需重复启动。`)
  console.log(`直接打开：http://localhost:${VITE_PORT}`)
  console.log('想重启的话，先结束正在运行的旧进程再执行 npm run dev。')
  process.exit(0)
}

console.log('启动 悦音 开发环境（API 网关 + vite）...\n')

if (apiUp) {
  console.log(`  · ${API_PORT} 端口已有网关在运行，直接复用`)
} else {
  run('api', [path.join(__dirname, 'api-server.js')])
}

if (viteUp) {
  console.log(`  · ${VITE_PORT} 端口已有 vite 在运行，直接复用`)
} else {
  run('vite', [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')])
}
