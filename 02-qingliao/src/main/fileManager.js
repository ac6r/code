import { app, shell, ipcMain } from 'electron'
import { join, extname, resolve, sep } from 'path'
import { promises as fs } from 'fs'

// 文件按扩展名归类，供前端筛选
const CATEGORY_EXT = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'],
  doc: [
    'txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'csv', 'json', 'js', 'ts', 'html', 'css', 'log'
  ]
}

function categoryOf(ext) {
  const e = String(ext || '').replace('.', '').toLowerCase()
  for (const key of Object.keys(CATEGORY_EXT)) {
    if (CATEGORY_EXT[key].includes(e)) return key
  }
  return 'other'
}

// 应用自己的文件目录：<userData>/files
function filesDir() {
  return join(app.getPath('userData'), 'files')
}

async function ensureDir() {
  await fs.mkdir(filesDir(), { recursive: true })
}

// 首次运行放入几个示例文件，保证页面不是空的
async function ensureSeedFiles() {
  await ensureDir()
  const dir = filesDir()
  const existing = await fs.readdir(dir).catch(() => [])
  if (existing.length > 0) return

  const seeds = [
    ['欢迎使用轻聊.txt', '欢迎使用轻聊！\n\n这里是文件管理目录，聊天中收发的文件都会保存在这里。\n'],
    ['轻聊使用说明.md', '# 轻聊使用说明\n\n- 登录 / 注册\n- 快速会话（已接入 AI）\n- 联系人管理\n- 设置中心\n'],
    ['会话备份示例.csv', '联系人,时间,内容\n小明,10:00,这道题应该怎么做\n小红,13:14,周六有空吗\n'],
    [
      'logo.svg',
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
        '<rect width="128" height="128" rx="24" fill="#07c160"/>' +
        '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="#ffffff" ' +
        'font-size="52" font-family="sans-serif">轻聊</text></svg>'
    ]
  ]

  for (const [name, content] of seeds) {
    await fs.writeFile(join(dir, name), content, 'utf-8').catch(() => {})
  }
}

// 只允许操作文件目录内的文件，避免路径穿越
function isInsideDir(target) {
  if (!target) return false
  const root = resolve(filesDir()) + sep
  return resolve(target).startsWith(root)
}

export function registerFileHandlers() {
  // 防止重复注册（重复调用 ipcMain.handle 会抛错）
  if (registerFileHandlers.done) return
  registerFileHandlers.done = true
  ipcMain.handle('file:list', async () => {
    await ensureSeedFiles()
    const dir = filesDir()
    const names = await fs.readdir(dir).catch(() => [])
    const files = []
    for (const name of names) {
      const full = join(dir, name)
      try {
        const stat = await fs.stat(full)
        if (!stat.isFile()) continue
        const ext = extname(name).replace('.', '').toLowerCase()
        files.push({
          name,
          path: full,
          ext,
          category: categoryOf(ext),
          size: stat.size,
          mtime: stat.mtimeMs
        })
      } catch (err) {
        // 单个文件读取失败不影响整体列表
      }
    }
    files.sort((a, b) => b.mtime - a.mtime)
    return { ok: true, dir, files }
  })

  ipcMain.handle('file:delete', async (_event, filePath) => {
    if (!isInsideDir(filePath)) return { ok: false, message: '非法路径' }
    try {
      await fs.unlink(filePath)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  })

  ipcMain.handle('file:open', async (_event, filePath) => {
    if (!isInsideDir(filePath)) return { ok: false, message: '非法路径' }
    const error = await shell.openPath(filePath)
    return error ? { ok: false, message: error } : { ok: true }
  })

  ipcMain.handle('file:reveal', (_event, filePath) => {
    if (!isInsideDir(filePath)) return { ok: false, message: '非法路径' }
    shell.showItemInFolder(filePath)
    return { ok: true }
  })

  ipcMain.handle('file:openDir', async () => {
    await ensureDir()
    const error = await shell.openPath(filesDir())
    return error ? { ok: false, message: error } : { ok: true }
  })

  // 图片返回 data URL 供页面预览；其余类型交给系统默认程序打开
  ipcMain.handle('file:preview', async (_event, filePath) => {
    if (!isInsideDir(filePath)) return { ok: false, message: '非法路径' }
    const ext = extname(filePath).replace('.', '').toLowerCase()
    if (!CATEGORY_EXT.image.includes(ext)) {
      return { ok: false, message: '该类型不支持预览' }
    }
    try {
      const buffer = await fs.readFile(filePath)
      if (buffer.length > 5 * 1024 * 1024) {
        return { ok: false, message: '图片过大，暂不支持预览' }
      }
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
      return { ok: true, dataUrl: `data:${mime};base64,${buffer.toString('base64')}` }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  })
}
