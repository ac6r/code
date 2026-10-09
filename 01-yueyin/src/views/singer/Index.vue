<template>
    <div class="singer" v-if="artist">
        <div class="singer-container">
            <div class="singer-main">
                <div class="singer-cover">
                    <div class="singer-avatar">
                        <el-image :src="artist.picUrl">
                            <template #placeholder>
                                <div class="image-slot">
                                    <i class="iconfont icon-placeholder"></i>
                                </div>
                            </template>
                        </el-image>
                    </div>
                    <div class="singer-info">
                        <div class="singer-title">{{ artist.name }}</div>
                        <div class="singer-stat">
                            <span><em>{{ artist.musicSize }}</em>单曲</span>
                            <span><em>{{ artist.albumSize }}</em>专辑</span>
                            <span><em>{{ artist.mvSize }}</em>MV</span>
                        </div>
                        <div class="singer-desc" v-if="desc">
                            <h5>歌手简介<em class="desc-close" v-if="isShowDesc" @click="isShowDesc = false"><i class="iconfont icon-closed"></i></em></h5>
                            <p @click="showAllDesc">{{ desc }}</p>
                            <pre class="singer-desc-all" v-if="isShowDesc">{{ desc }}</pre>
                        </div>
                        <div class="singer-oper">
                            <span class="play-all" @click="playAllSongs"><i class="iconfont icon-audio-play"></i>播放热门</span>
                            <span :class="['collect', isSub ? 'active' : '']" @click="subArtist"><i :class="['iconfont','icon-collect' + (isSub ? '-active' : '')]"></i>{{ isSub ? '已收藏' : '收藏' }}</span>
                        </div>
                    </div>
                </div>

                <div class="song-main">
                    <div class="song-header">
                        <h4>热门歌曲<em>{{ hotSongs.length + '首歌' }}</em></h4>
                    </div>
                    <song-list :songList="hotSongs" :stripe="true"></song-list>
                </div>

                <div class="block-box" v-if="hotAlbums.length">
                    <h3 class="block-title">专辑<router-link class="block-more" :to="{path:'/singer',query:{id:sUid,type:'album'}}">全部</router-link></h3>
                    <album-list :albumList="hotAlbums" :num="6"></album-list>
                </div>

                <div class="block-box" v-if="mvs.length">
                    <h3 class="block-title">MV<router-link class="block-more" :to="{path:'/singer',query:{id:sUid,type:'mv'}}">全部</router-link></h3>
                    <mv-list :mvList="mvs" :num="6"></mv-list>
                </div>
            </div>

            <div class="aside-box">
                <el-affix :offset="140">
                    <div class="aside-singer" v-if="artist">
                        <h3 class="aside-title">{{ artist.name }}</h3>
                        <div class="aside-face">
                            <el-image :src="artist.picUrl">
                                <template #placeholder>
                                    <div class="image-slot">
                                        <i class="iconfont icon-placeholder"></i>
                                    </div>
                                </template>
                            </el-image>
                        </div>
                    </div>
                </el-affix>
            </div>
        </div>
    </div>
    <div class="singer-loading" v-else-if="isLoading">
        <Loading />
    </div>
</template>

<script setup>
import SongList from '@components/SongList.vue'
import AlbumList from '@components/AlbumList.vue'
import MvList from '@components/MvList.vue'
import Loading from '@components/Loading.vue'

import { getCurrentInstance, onMounted, reactive, toRefs } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { usePlayerStore } from '@/stores/player'

const { proxy } = getCurrentInstance()
const store = usePlayerStore()
const route = useRoute()

const info = reactive({
    sUid: '',
    artist: null,
    hotSongs: [],
    hotAlbums: [],
    mvs: [],
    desc: '',
    isSub: false,
    isShowDesc: false,
    isLoading: true
})

// 歌手热门歌曲
const getArtists = async () => {
    const { data: res } = await proxy.$http.artists({ id: info.sUid, timestamp: new Date().valueOf() })

    if (res.code !== 200) {
        return proxy.$msg.error('数据请求失败')
    }

    info.artist = res.artist
    info.isSub = !!res.artist.followed
    info.hotSongs = (res.hotSongs || []).map(item => {
        return {
            id: String(item.id),
            name: item.name,
            mvId: item.mv,
            singer: item.ar,
            album: item.al,
            alia: item.alia,
            vip: item.fee === 1,
            license: item.license,
            duration: proxy.$utils.formatSongTime(item.dt),
            url: `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
            publishTime: proxy.$utils.formatMsgTime(item.publishTime)
        }
    })
}

// 歌手介绍
const getArtistDesc = async () => {
    const { data: res } = await proxy.$http.artistDesc({ id: info.sUid })

    if (res.code !== 200) {
        return
    }
    info.desc = res.briefDesc
}

// 歌手专辑
const getArtistAlbum = async () => {
    const { data: res } = await proxy.$http.artistAlbum({ id: info.sUid, limit: 6, offset: 0 })

    if (res.code !== 200) {
        return
    }
    info.hotAlbums = res.hotAlbums || []
}

// 歌手 MV
const getArtistMv = async () => {
    const { data: res } = await proxy.$http.artistMv({ id: info.sUid, limit: 6, offset: 0 })

    if (res.code !== 200) {
        return
    }
    info.mvs = res.mvs || []
}

// 播放热门歌曲
const playAllSongs = () => {
    if (!info.hotSongs.length) {
        return
    }
    store.playAll({ list: info.hotSongs })
    store.SET_PLAYLISTTIPS(true)
}

// 收藏 / 取消收藏歌手
const subArtist = async () => {
    if (!store.isLogin) {
        store.setLoginDialog(true)
        proxy.$msg.info('请先登录')
        return
    }
    const uid = store.userInfo?.userId
    if (uid && String(uid).startsWith('local_')) {
        info.isSub = !info.isSub
        proxy.$msg.success(info.isSub ? '已收藏' : '已取消收藏')
        return
    }
    const { data: res } = await proxy.$http.artistSub({ id: info.sUid, t: info.isSub ? '0' : '1' })
    if (res.code !== 200) {
        return proxy.$msg.error('数据请求失败')
    }
    info.isSub = !info.isSub
    proxy.$msg.success(info.isSub ? '已收藏' : '已取消收藏')
}

// 简介展开/收起
const showAllDesc = () => {
    if (info.desc && info.desc.length > 120) {
        info.isShowDesc = !info.isShowDesc
    }
}

const _initialize = async () => {
    info.isLoading = true
    info.artist = null
    info.hotSongs = []
    info.hotAlbums = []
    info.mvs = []
    info.desc = ''
    info.isShowDesc = false

    try {
        await getArtists()
        // 主信息拿到后再并行加载附属数据
        await Promise.all([getArtistDesc(), getArtistAlbum(), getArtistMv()])
    } catch (err) {
        proxy.$msg.error('数据请求失败')
    } finally {
        info.isLoading = false
    }
}

onMounted(() => {
    info.sUid = route.query.id
    _initialize()
})

// 同路由下切换歌手时重新加载
onBeforeRouteUpdate((to) => {
    info.sUid = to.query.id
    _initialize()
})

const { sUid, artist, hotSongs, hotAlbums, mvs, desc, isSub, isShowDesc, isLoading } = toRefs(info)
</script>

<style scoped lang="less">
.singer-container {
    display: flex;
    padding-top: 40px;
}

.singer-main {
    flex: 1;
    padding-bottom: 45px;
}

.singer-cover {
    display: flex;
    padding: 30px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
}

.singer-avatar {
    position: relative;
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 12px;

    .el-image {
        width: 100%;
        height: 100%;
        border-radius: 12px;
    }
}

.singer-info {
    flex: 1;
    padding: 0 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
}

.singer-title {
    padding-bottom: 20px;
    font-size: 26px;
    font-weight: bold;
}

.singer-stat {
    display: flex;
    padding-bottom: 20px;
    color: var(--color-text);

    span {
        margin-right: 30px;
        font-size: 14px;

        em {
            font-style: normal;
            font-weight: 600;
            color: var(--color-text-main);
            margin-right: 6px;
        }
    }
}

.singer-desc {
    position: relative;

    h5 {
        padding: 0 0 5px;
        line-height: 20px;
        font-size: 14px;
        color: #333;
    }

    .desc-close {
        position: absolute;
        top: 0;
        right: 0;
        cursor: pointer;
    }

    p {
        display: -webkit-box;
        line-height: 22px;
        font-size: 14px;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: pre-line;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        word-break: break-all;
        cursor: pointer;
    }

    .singer-desc-all {
        position: relative;
        z-index: 1;
        padding: 10px 0;
        margin-top: 10px;
        max-height: 250px;
        line-height: 22px;
        font-size: 14px;
        white-space: pre-line;
        font-family: inherit;
        color: #999;
        background: #fff;
        overflow-y: auto;
    }
}

.singer-oper {
    display: flex;
    padding-top: 25px;

    span {
        display: flex;
        line-height: 16px;
        align-items: center;
        justify-content: center;
        border-radius: 50px;
        padding: 7px 20px;
        cursor: pointer;
        margin-right: 15px;
        transition: all .4s;
        background: #f0f0f0;
        color: #333;

        i {
            margin-right: 3px;
        }
    }

    .play-all {
        color: #fff;
        background: var(--color-text-height);

        i {
            color: #fff;
        }
    }

    .collect.active,
    .collect.active i {
        color: var(--color-text-height);
    }
}

.song-main {
    position: relative;
    padding: 20px;
    margin-top: 25px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
}

.song-header {
    padding: 0 0 10px;

    h4 {
        font-size: 20px;
        line-height: 40px;

        em {
            display: inline-block;
            padding-left: 10px;
            font-size: 12px;
            font-style: normal;
            font-weight: normal;
            color: #666;
            vertical-align: baseline;
        }
    }
}

.block-box {
    padding: 20px;
    margin-top: 25px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
}

.block-title {
    position: relative;
    padding-bottom: 10px;
    font-size: 20px;
    line-height: 40px;

    .block-more {
        display: inline-block;
        position: absolute;
        right: 0;
        top: 0;
        font-weight: normal;
        font-size: 12px;
        color: #666;
    }

    &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 18px;
        margin: 11px 8px 0 0;
        border-radius: 2px;
        background: var(--color-text-height);
        vertical-align: top;
    }
}

.aside-box {
    width: 300px;
    margin-left: 25px;
    flex-shrink: 0;
}

.aside-singer {
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);

    .aside-title {
        position: relative;
        padding-bottom: 15px;
        font-size: 16px;
        line-height: 24px;

        &::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 18px;
            margin: 3px 5px 0 0;
            border-radius: 2px;
            background: var(--color-text-height);
            vertical-align: top;
        }
    }

    .aside-face {
        width: 100%;
        border-radius: 8px;
        overflow: hidden;

        .el-image {
            width: 100%;
            display: block;
        }
    }
}

.singer-loading {
    padding: 40px 0;
}

/* 平板端 */
.respond-tablet({
    .singer-avatar {
        width: 160px;
        height: 160px;
    }
    .singer-info {
        padding: 0 20px;
    }
    .singer-title {
        font-size: 22px;
    }
    .aside-box {
        width: 220px;
        margin-left: 15px;
    }
});

/* 移动端 */
.respond-mobile({
    .singer-container {
        flex-direction: column;
        padding-top: 20px;
    }
    .singer-cover {
        flex-direction: column;
        padding: 20px;
    }
    .singer-avatar {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
    }
    .singer-info {
        padding: 20px 0 0;
    }
    .singer-title {
        font-size: 20px;
        padding-bottom: 15px;
    }
    .singer-stat {
        padding-bottom: 15px;
        flex-wrap: wrap;

        span {
            margin-right: 20px;
            margin-bottom: 5px;
        }
    }
    .aside-box {
        width: 100%;
        margin-left: 0;
        margin-top: 25px;
    }
    .song-main,
    .block-box {
        padding: 12px;
        margin-top: 15px;
    }
    .song-header h4,
    .block-title {
        font-size: 16px;
        line-height: 32px;
    }
    .singer-oper span {
        padding: 5px 12px;
        font-size: 12px;
        margin-right: 8px;
    }
});
</style>
