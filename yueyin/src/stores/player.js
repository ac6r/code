import { defineStore } from 'pinia'
import utils from '@/utils/util'

// 合并歌曲到播放列表查重
const concatPlayList = (list, playList = []) => {
    return utils.concatPlayList(
        list.filter(item => !item.license && !item.vip),
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
        userInfo: JSON.parse(window.localStorage.getItem('userInfo') || 'null') || null,

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
        playAll({ list }) {
            this.SET_PLAYLIST(concatPlayList(list))
            this.SET_PLAYSTATUS(true)
            this.SET_PLAYINDEX(0)
        },
        selectPlay({ list }) {
            const pl = concatPlayList(list, this.playList)
            this.SET_PLAYLIST(pl)
            this.SET_PLAYSTATUS(true)
            this.SET_PLAYINDEX(pl.findIndex(d => d.id === list[0].id))
        },
        addList({ list }) {
            this.SET_PLAYLIST(concatPlayList(list, this.playList))
            this.SET_PLAYLISTTIPS(true)
        },
    },
})
