import { app, ipcMain, shell } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'

// 读取应用自身版本（优先读 package.json，避免取到 Electron 的版本号）
function readAppVersion() {
  const candidates = [app.getAppPath(), process.cwd()]
  for (const dir of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
      if (pkg && pkg.version) return pkg.version
    } catch (err) {
      // 该目录没有 package.json，试下一个
    }
  }
  return app.getVersion()
}

export function registerAppInfoHandlers() {
  // 防止重复注册（重复调用 ipcMain.handle 会抛错）
  if (registerAppInfoHandlers.done) return
  registerAppInfoHandlers.done = true

  // 关于页需要：名称、版本、运行时信息
  ipcMain.handle('app:info', () => ({
    name: '轻聊',
    version: readAppVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    isDev: !app.isPackaged
  }))

  // 打开外部链接（只允许 http/https）
  ipcMain.handle('app:openExternal', (_event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return { ok: false, message: '不支持的链接' }
    }
    shell.openExternal(url)
    return { ok: true }
  })
}
