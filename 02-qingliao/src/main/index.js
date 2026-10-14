import { app, shell, screen, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { onLoginOrRegister, onLoginSuccess, winTitleOp } from './ipc'
import { registerAiHandlers } from './ai'
import { registerFileHandlers } from './fileManager'
import { animateWindowBounds } from './windowAnimator'
import { registerAppInfoHandlers } from './appInfo'

// 是否处于“最大化”状态（含自定义动画最大化）
function isWindowMaximized(win) {
  return win.isMaximized() || !!win.normalBounds
}

// 把真实窗口状态同步给渲染进程，保证按钮图标与实际一致
function sendWinState() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('winState', {
    isMaximized: isWindowMaximized(mainWindow),
    isAlwaysOnTop: mainWindow.isAlwaysOnTop()
  })
}

async function smoothMaximize(win) {
  if (!win || win.isDestroyed()) return
  if (win.isMaximized() || win.isFullScreen()) return
  // 只在第一次进入最大化时记住原大小，连点也不会记错
  if (!win.normalBounds) win.normalBounds = win.getBounds()
  const { workArea } = screen.getDisplayMatching(win.getBounds())
  await animateWindowBounds(win, workArea, 240)
  sendWinState()
}

async function smoothRestore(win) {
  if (!win || win.isDestroyed()) return
  // 原生最大化先交还给系统还原
  if (win.isMaximized()) {
    win.unmaximize()
    return
  }
  if (!win.normalBounds) return
  const target = win.normalBounds
  await animateWindowBounds(win, target, 220)
  win.normalBounds = null
  sendWinState()
}

// 简易 .env 加载：存在则读入 process.env（不覆盖已存在的变量），方便本地配置 AI 密钥
function loadDotEnv() {
  try {
    const content = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    content.split(/\r?\n/).forEach((line) => {
      const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (!matched) return
      const key = matched[1]
      let value = matched[2] || ''
      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1)
      if (process.env[key] === undefined) process.env[key] = value
    })
  } catch (err) {
    // 没有 .env 文件时忽略
  }
}
loadDotEnv()


const NODE_ENV = process.env.NODE_ENV
const LOGIN_WIDTH = 300;
const LOGIN_HEIGHT = 370;
const REGISTER_HEIGHT = 490;


let mainWindow = null;
// 声明解绑函数，方便清理
let unbindLoginOrRegister = null;
let unbindLoginSuccess = null;


function createWindow() {
  mainWindow = new BrowserWindow({
    icon: icon,
    width: LOGIN_WIDTH,
    height: LOGIN_HEIGHT,
    show: false,
    resizable: false,
    transparent: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    maximizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false
    }
  })

  mainWindow.on('maximize', sendWinState);
  mainWindow.on('unmaximize', sendWinState);
  mainWindow.on('restore', sendWinState);
  mainWindow.on('always-on-top-changed', sendWinState);

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setTitle("轻聊")
  })

  const handleLoginOrRegister = async (e, isLogin) => {
    if (!mainWindow) return;
    const targetHeight = isLogin ? LOGIN_HEIGHT : REGISTER_HEIGHT;
    const { workArea } = screen.getDisplayMatching(mainWindow.getBounds());
    // 平滑地变高/变矮，并居中；非可调窗口会忽略 setBounds，所以先临时开启
    const target = {
      x: Math.round(workArea.x + (workArea.width - LOGIN_WIDTH) / 2),
      y: Math.round(workArea.y + (workArea.height - targetHeight) / 2),
      width: LOGIN_WIDTH,
      height: targetHeight
    };
    mainWindow.setResizable(true);
    await animateWindowBounds(mainWindow, target, 200);
    mainWindow.setResizable(false);
  };

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  unbindLoginOrRegister = onLoginOrRegister(handleLoginOrRegister);

  unbindLoginSuccess = onLoginSuccess((config) => {
    // 先判空，避免报错
    if (!mainWindow) return;

    try {
      mainWindow.setResizable(true);
      mainWindow.setMinimumSize(800, 600);
      mainWindow.setSize(850, 800);
      mainWindow.center();
      mainWindow.setMaximizable(true);
      mainWindow.setMaximizable(true);
      mainWindow.setAlwaysOnTop(false);

      //  TODO 管理后台的窗口操作，托盘操作
      if (config?.admin) {
      }
    } catch (err) {
      console.error('登录成功后调整窗口失败：', err);
    }
  })

  winTitleOp((e, { action, data }) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    if (!win) {
      return
    }
    switch (action) {
      case "close": {
        if (data.closeType == 0) {
          win.close()
        } else {
          win.setSkipTaskbar(true)
          win.hide()
        }
        break
      }
      case "minimize": {
        win.minimize()
        break
      }
      case "maximize": {
        smoothMaximize(win)
        break
      }
      case "unmaximize": {
        smoothRestore(win)
        break
      }
      case "top": {
        win.setAlwaysOnTop(data.top)
        break
      }
    }
  })

  mainWindow.on('closed', () => {
    if (unbindLoginOrRegister) unbindLoginOrRegister();
    if (unbindLoginSuccess) unbindLoginSuccess();
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');
  // 分开注册并各自兜底：任一模块注册失败都不影响其它 IPC 通道
  try {
    registerAiHandlers();
  } catch (err) {
    console.error('[ipc] 注册 AI 通道失败：', err);
  }
  try {
    registerFileHandlers();
  } catch (err) {
    console.error('[ipc] 注册文件管理通道失败：', err);
  }
  try {
    registerAppInfoHandlers();
  } catch (err) {
    console.error('[ipc] 注册应用信息通道失败：', err);
  }
  console.log('[ipc] 已注册通道：chat:ai, file:*, app:info/openExternal');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
