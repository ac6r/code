import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { onLoginOrRegister, onLoginSuccess, winTitleOp } from './ipc'


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
    transparent: true,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    maximizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false
    }
  })

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setTitle("轻聊")
  })

  const handleLoginOrRegister = (e, isLogin) => {
    if (!mainWindow) return;
    mainWindow.setResizable(true);
    const targetHeight = isLogin ? LOGIN_HEIGHT : REGISTER_HEIGHT;
    mainWindow.setSize(LOGIN_WIDTH, targetHeight);
    mainWindow.center();
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
        win.maximize()
        break
      }
      case "unmaximize": {
        win.unmaximize()
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