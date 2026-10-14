import { defineStore } from 'pinia'
import utils from '@/utils/util'

// 合并歌曲到播放列表查重；VIP 与无版权歌曲一律不加入播放列表
const concatPlayList = (list = [], playList = []) => {
    return utils.concatPlayList(
        list.filter(item => item && !item.license && !item.vip),
        playList
    )
}

// 从 localStorage 恢复状态
const loadState = (key, fallback) => {
    try {
        const val = window.localStorage.getItem(key)
        return val ? JSON.parse(val) : fallback
    } catch { return fallback }
}

export const usePlayerStore = defineStore('player', {
    state: () => ({
        // 登录相关——优先从 localStorage 恢复
        isLogin: loadState('isLogin', false),
        loginDialogVisible: false,
        // 同样走安全解析：localStorage 里若是坏值（例如字符串 "undefined"），
        // JSON.parse 会抛错并让整个 store 初始化失败、页面直接白屏。
        userInfo: loadState('userInfo', null),

        // 播放相关——优先从 localStorage 恢复
        isPlayed: false,
        playList: loadState('playList', []),
        playIndex: loadState('playIndex', 0),
        isShowPlayListTips: false,
    }),

    actions: {
        // 登录
        setLogin(val = false) {
            this.isLogin = val
        },
        setUserInfo(val) {
            this.userInfo = val
        },
        setLoginDialog(val) {
            this.loginDialogVisible = val
        },

        // 播放
        SET_PLAYSTATUS(val = false) {
            this.isPlayed = val
        },
        SET_PLAYLIST(val = null) {
            this.playList = val
            window.localStorage.setItem('playList', JSON.stringify(val))
        },
        SET_PLAYINDEX(val = 0) {
            this.playIndex = val
            window.localStorage.setItem('playIndex', val)
        },
        SET_PLAYLISTTIPS(val = false) {
            this.isShowPlayListTips = val
        },

        // 复合操作
        loginSuc(val) {
            this.setLoginDialog(val)
        },
        // 以下三个方法都返回「是否产生了可播放的内容」，方便调用方给出提示，
        // 避免出现“点了播放全部但什么都没发生”的静默失败。
        playAll({ list }) {
            const playlist = concatPlayList(list)
            if (!playlist.length) return false
            this.SET_PLAYLIST(playlist)
            this.SET_PLAYSTATUS(true)
            this.SET_PLAYINDEX(0)
            return true
        },
        selectPlay({ list }) {
            const playlist = concatPlayList(list, this.playList)
            if (!playlist.length) return false
            this.SET_PLAYLIST(playlist)
            this.SET_PLAYSTATUS(true)
            // 目标歌曲若因 VIP / 无版权被过滤掉，退回列表里已有的一首，
            // 避免出现 findIndex 返回 -1 的坏状态（播放器会指向空歌曲）
            const index = playlist.findIndex(item => item.id === list[0].id)
            this.SET_PLAYINDEX(index > -1 ? index : 0)
            return true
        },
        addList({ list }) {
            const playlist = concatPlayList(list, this.playList)
            if (playlist.length === this.playList.length) return false
            this.SET_PLAYLIST(playlist)
            return true
        },
    },
})
