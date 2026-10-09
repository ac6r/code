// 本地用户管理（mock 网易云注册/登录）

const STORAGE_KEY = 'localUsers'

export function getLocalUsers() {
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

export function saveLocalUser(user) {
    const users = getLocalUsers()
    users.push(user)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function findLocalUser(phone, password) {
    const users = getLocalUsers()
    return users.find(u => u.phone === phone && u.password === password)
}

export function buildLocalUserInfo(user) {
    return {
        userId: user.userId,
        nickname: user.nickname,
        avatarUrl: 'https://p1.music.126.net/6y-UleORITYMO_K9p7XXFg==/109951169968206667.jpg',
        signature: '',
        follows: 0,
        followeds: 0,
        level: 1,
    }
}
