import { defineStore } from "pinia"

function loadAccounts() {
    try {
        const stored = localStorage.getItem('knownAccounts')
        return stored ? JSON.parse(stored) : []
    } catch (e) {
        return []
    }
}

function saveAccounts(accounts) {
    localStorage.setItem('knownAccounts', JSON.stringify(accounts))
}

function loadUserInfo() {
    try {
        const stored = localStorage.getItem('userInfo')
        return stored ? JSON.parse(stored) : {}
    } catch (e) {
        return {}
    }
}

export const useUserInfoStore = defineStore('userInfo', {
    state: () => {
        return {
            userInfo: loadUserInfo(),
            accounts: loadAccounts()
        }
    },
    getters: {
        currentUserId: (state) => state.userInfo.userId || '',
        currentNickName: (state) => state.userInfo.nickName || '未登录'
    },
    actions: {
        setInfo(userInfo) {
            this.userInfo = userInfo
            localStorage.setItem("userInfo", JSON.stringify(userInfo))
            // 同时记住该账号
            this.rememberAccount(userInfo)
        },
        getInfo() {
            return this.userInfo
        },
        // 记住一个账号（用于快速切换）
        rememberAccount(accountInfo) {
            if (!accountInfo || !accountInfo.userId) return
            const exists = this.accounts.find(a => a.userId === accountInfo.userId)
            if (exists) {
                // 更新已有账号信息
                Object.assign(exists, accountInfo)
            } else {
                this.accounts.push({ ...accountInfo })
            }
            saveAccounts(this.accounts)
        },
        // 切换到指定账号
        switchToAccount(account) {
            if (!account || !account.userId) return
            // 先确保账号在列表中
            this.rememberAccount(account)
            // 切换当前用户
            this.userInfo = { ...account }
            localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        },
        // 移除已记住的账号
        removeAccount(userId) {
            this.accounts = this.accounts.filter(a => a.userId !== userId)
            saveAccounts(this.accounts)
        },
        // 加载所有演示账号（硬编码，与 mock/account.js 中 DEMO_ACCOUNTS 保持同步）
        loadDemoAccounts() {
            const demos = [
                {
                    email: 'xiaoming@test.com',
                    userId: 'u_fixed1',
                    nickName: '小明',
                    sex: 1,
                    areaName: '北京 朝阳',
                    joinType: 0,
                    personalSignature: '好好学习，天天向上',
                    avatar: 'https://robohash.org/u_fixed1?set=set4',
                    token: 'MOCK-TOKEN-XIAOMING'
                },
                {
                    email: 'xiaohong@test.com',
                    userId: 'u_fixed2',
                    nickName: '小红',
                    sex: 0,
                    areaName: '上海 浦东',
                    joinType: 0,
                    personalSignature: '生活就像骑自行车，想保持平衡就得往前走',
                    avatar: 'https://robohash.org/u_fixed2?set=set4',
                    token: 'MOCK-TOKEN-XIAOHONG'
                },
                {
                    email: 'demo@test.com',
                    userId: 'u_demo',
                    nickName: '演示用户',
                    sex: 1,
                    areaName: '广东 深圳',
                    joinType: 0,
                    personalSignature: '代码改变世界',
                    avatar: '',
                    token: 'MOCK-TOKEN-DEMO'
                }
            ]
            demos.forEach(account => {
                this.rememberAccount(account)
            })
        }
    }
});