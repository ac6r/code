import { ipcMain } from 'electron'
import store from './store';
const NODE_ENV = process.env.NODE_ENV
const onLoginOrRegister = (handleLoginOrRegister) => {
    ipcMain.on("loginOrRegister", handleLoginOrRegister);
    // 返回解绑函数，方便清理
    return () => ipcMain.off("loginOrRegister", handleLoginOrRegister);
}

// 简化onLoginSuccess，仅负责绑定事件
const onLoginSuccess = (callback) => {
    ipcMain.on("openChat", (e, config) => {
        store.initUserId(config.userId)
        // stoer.setUseData("token",config.token)
        callback(config);
        // YODO初始化ws连接

    });
    return () => ipcMain.off("openChat", callback);
}
const winTitleOp = (callback) => {
    ipcMain.on("winTitleop", (e, data) => {
        callback(e, data)
    })
}
export { onLoginOrRegister, onLoginSuccess, winTitleOp }