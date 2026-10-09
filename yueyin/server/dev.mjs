// npm run dev 的入口：同时拉起「API 网关」和「vite 开发服务器」。
//
// 这样只跑一条命令就能得到完整环境——之前需要手动另开一个终端启动后端，
// 忘了启动就会出现接口全 502、页面一片空白的情况。
import { spawn } from 'node:child_process'
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

console.log('启动 悦音 开发环境（API 网关 + vite）...\n')
run('api', [path.join(__dirname, 'api-server.js')])
run('vite', [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')])
