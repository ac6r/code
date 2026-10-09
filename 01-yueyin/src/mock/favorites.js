// 本地收藏管理（mock 歌单收藏）

const STORAGE_KEY = 'localFavorites'

export function getLocalFavorites() {
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

function saveLocalFavorites(list) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function isFavorited(id) {
    return getLocalFavorites().some(item => item.id === id)
}

export function toggleFavorite(item) {
    const list = getLocalFavorites()
    const index = list.findIndex(f => f.id === item.id)
    if (index >= 0) {
        list.splice(index, 1)
        saveLocalFavorites(list)
        return false
    }
    list.push({
        id: item.id,
        name: item.name,
        coverImgUrl: item.coverImgUrl,
        playCount: item.playCount,
        trackCount: item.trackCount,
        creator: item.creator ? { nickname: item.creator.nickname } : {},
        subscribedCount: item.subscribedCount,
        tags: item.tags || [],
        favoritedAt: new Date().toISOString()
    })
    saveLocalFavorites(list)
    return true
}
