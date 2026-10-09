// 以 CommonJS 启动真实的 NeteaseCloudMusicApi 服务。
// 网关（server/api-server.js）会把请求转发到这里，转发失败时自动回落到本地 mock。
//
// 注意：必须用 .cjs 后缀。package.json 里是 "type": "module"，
// 而 NeteaseCloudMusicApi 是 CommonJS 包，只能用 require 加载。
const fs = require('fs')
const os = require('os')
const path = require('path')

const PORT = Number(process.env.NCM_PORT || 3001)

// NeteaseCloudMusicApi/util/request.js 在 require 阶段会同步读取这个文件，
// 不存在会直接抛 ENOENT 让整个进程起不来。app.js 里的 generateConfig() 也是
// 为了生成它，但那一步要联网，这里先建空文件保证离线也能启动。
const tokenFile = path.resolve(os.tmpdir(), 'anonymous_token')
if (!fs.existsSync(tokenFile)) {
  fs.writeFileSync(tokenFile, '', 'utf-8')
}

require('NeteaseCloudMusicApi/server')
  .serveNcmApi({ port: PORT, checkVersion: false })
  .then(() => console.log(`[netease] 真实 API 已就绪 http://127.0.0.1:${PORT}`))
  .catch((err) => {
    console.error('[netease] 启动失败:', err && err.message)
    process.exit(1)
  })
