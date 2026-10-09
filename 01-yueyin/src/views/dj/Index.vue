<template>
    <div class="dj">
        <div class="dj-container">
            <div class="dj-main">
                <div class="cover">
                    <div class="cover-img">
                        <el-image :src="djInfo.picUrl">
                            <template #placeholder>
                                <div class="image-slot">
                                    <i class="iconfont icon-placeholder"></i>
                                </div>
                            </template>
                        </el-image>
                    </div>
                    <div class="cover-info">
                        <div class="cover-header">
                            <div class="cover-title">
                                <i class="iconfont icon-dj"></i> {{djInfo.name}}
                            </div>
                        </div>
                        <div class="cover-author-tags" v-if="djInfo.dj">
                            <div class="cover-author">
                                <el-image :src="djInfo.dj.avatarUrl" class="cover-avatar">
                                    <template #placeholder>
                                        <div class="image-slot">
                                            <i class="iconfont icon-placeholder"></i>
                                        </div>
                                    </template>
                                </el-image>
                                <div class="cover-name">{{djInfo.dj.nickname}}</div>
                                <div class="cover-date" v-if="djInfo.createTime">{{$utils.formartDate(djInfo.createTime, 'yyyy-MM-dd')}} 创建</div>
                            </div>
                        </div>
                        <div class="cover-digital">
                            <span class="cover-playCount"><i class="iconfont icon-playnum"></i> {{$utils.formartNum(djInfo.playCount)}}次</span>
                            <span class="cover-collect"><i class="iconfont icon-collect"></i> {{$utils.formartNum(djInfo.subCount)}}</span>
                            <span class="cover-comment"><i class="iconfont icon-comment"></i> 共{{$utils.formartNum(djInfo.programCount)}}期</span>
                        </div>
                        <div class="cover-desc">
                            <h5>电台简介</h5>
                            <p v-html="djInfo.desc"></p>
                        </div>
                    </div>
                </div>
                <div class="song-main">
                    <div class="song-header">
                        <h4>节目列表 <em>{{total + '期节目'}}</em></h4>
                        <span class="play-all" @click="playAllPrograms"><i class="iconfont icon-audio-play"></i> 播放全部</span>
                        <span :class="['collect', djInfo.subed ? 'active' : '']" @click="subDjRadio(djInfo)"><i :class="['iconfont', 'icon-collect' + (djInfo.subed ? '-active' : '')]"></i> {{ djInfo.subed ? '已订阅' : '订阅'}}</span>
                    </div>
                    <template v-if="isLoading">
                        <Loading />
                    </template>
                    <template v-else>
                        <song-list :songList="programList" :stripe="true"></song-list>
                    </template>
                </div>
            </div>
            <div class="dj-aside">
                <div class="aside-title">
                    <h3>热门电台</h3>
                </div>
                <div class="type-main">
                    <div class="type-item" :class="rId == item.id ? 'active' : ''" v-for="(item, index) in list" :key="index" @click="selectItem(item)">
                        <el-image class="item-img" :src="item.picUrl">
                            <template #placeholder>
                                <div class="image-slot">
                                    <i class="iconfont icon-placeholder"></i>
                                </div>
                            </template>
                        </el-image>
                        <div class="item-info">
                            <div class="item-title">
                                {{item.name}}
                            </div>
                            <div class="item-time">
                                共{{$utils.formartNum(item.programCount)}}期
                            </div>
                            <div class="item-rcmdtext" v-if="item.rcmdtext">{{item.rcmdtext}}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import SongList from '@components/SongList.vue'
import Loading from '@components/Loading.vue'
import { getCurrentInstance,reactive,computed,onMounted,watchEffect,toRefs } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {usePlayerStore} from "@/stores/player"
import { toggleFavorite, isFavorited } from '@/mock/favorites'
import { formatSongInfo } from '@/utils/song'

const {proxy} = getCurrentInstance()
const route = useRoute()
const router = useRouter()
const store = usePlayerStore()
const userInfo = computed(() => store.userInfo)
const isLocalUser = computed(() => {
    const uid = userInfo.value?.userId
    return uid && String(uid).startsWith('local_')
})

const info = reactive({
     list:[],
     rId:'',
     djInfo:{},
     programList:[],
     total:0,
     isLoading:true
})

//获取热门电台列表
const getHotDj = async() => {
    const { data:res } = await proxy.$http.getHotDj({limit:12,offset:0})

    if(res.code !== 200) {
        return proxy.$msg.error('数据请求失败')
    }

    info['list'] = res.djRadios
    //默认选中第一个
    if(!info.rId && info.list.length) {
        info['rId'] = info.list[0].id
    }

}

 // 获取电台详情
const getDjDetail = async() => {
    const { data: res } = await proxy.$http.djDetail({ rid: info.rId })

    if (res.code !== 200) {
        return proxy.$msg.error('数据请求失败')
    }

    info['djInfo'] = res.data || {}
    // 本地用户：用收藏状态模拟订阅
    if (isLocalUser.value && isFavorited(res.data.id)) {
        info.djInfo.subed = true
    }
}

//获取电台节目列表
const getDjProgram = async() =>{
    info['isLoading'] = true
    const { data:res } = await proxy.$http.djProgram({rid:info.rId, limit:100,offset:0})

    if (res.code !== 200) {
        info['isLoading'] = false
        return proxy.$msg.error('数据请求失败')
    }

    info['programList'] = formatPrograms(res.programs)
    info['total'] = info.programList.length
    info['isLoading'] = false
}

// 将电台节目转换为可播放的歌曲格式
const formatPrograms = (programs) => {
    const ret = []
    if (!programs || !programs.length) {
        return ret
    }
    // 电台封面作为节目缺少专辑封面时的兜底
    const fallbackCover = info.djInfo.picUrl || ''
    programs.map(item => {
        if (item.mainSong && item.mainSong.id) {
            const song = formatSongInfo(item.mainSong)
            // 电台节目没有 mv，清理掉避免渲染 MV 图标
            song.mvId = 0
            // 电台节目的 mainSong 可能缺少 al（专辑）字段，播放栏会读取 album.picUrl，
            // 这里统一补全，避免 'Cannot read properties of undefined (reading picUrl)'
            if (!song.album || !song.album.id) {
                song.album = { id: 0, name: info.djInfo.name || '电台节目', picUrl: fallbackCover }
            } else if (!song.album.picUrl) {
                song.album.picUrl = fallbackCover
            }
            ret.push(song)
        }
    })
    return ret
}

const selectItem = (item) => {
    info.rId = item.id
     router.push({path:'dj', query:{id:info.rId}})
}

// 收藏、取消电台
const subDjRadio = async(item) => {
    if (!store.isLogin) {
        store.setLoginDialog(true)
        proxy.$msg.info('请先登录')
        return
    }
    if (!isLocalUser.value) {
        const { data: res } = await proxy.$http.subDj({ rid: item.id, t: (item.subed ? 0 : 1) })
        if (res.code !== 200) {
            return proxy.$msg.error('数据请求失败')
        }
        info.djInfo.subed = !info.djInfo.subed
        proxy.$msg.success(info.djInfo.subed ? '已订阅' : '已取消订阅')
        return
    }
    // 本地用户：使用 localStorage
    const favorited = toggleFavorite({
        id: item.id,
        name: item.name,
        picUrl: item.picUrl,
        coverImgUrl: item.picUrl,
        playCount: item.playCount,
        programCount: item.programCount,
        subCount: item.subCount
    })
    info.djInfo.subed = favorited
    proxy.$msg.success(favorited ? '已添加到我的音乐' : '已取消收藏')
}


// 播放全部节目
const playAllPrograms = () => {
    if (!info.programList.length) {
        return proxy.$msg.info('暂无可播放的节目')
    }
    store.playAll({ list: info.programList })
    store.SET_PLAYLISTTIPS(true)
}

onMounted(() => {
    info['rId'] = route.query.id || ''
    getHotDj()
})

watchEffect(async() => {
    if (info.rId) {
        await getDjDetail()
        getDjProgram()
    }
})

const { list, rId, djInfo, programList, total, isLoading } = toRefs(info)
</script>

<style lang="less" scoped>
.dj-container {
    display: flex;
    padding: 40px 0 0 0;
}
.dj-main {
    flex: 1;
    padding-bottom: 45px;
}

.dj-aside {
    width: 450px;
    padding-bottom: 25px;
    flex-shrink: 0;
    padding-left: 20px;
}

.aside-title {
    padding: 0 0 15px;

    h3 {
        font-size: 20px;
        line-height: 30px;
    }
}

.cover {
    display: flex;
}
.cover-img {
    display: flex;
    align-items: center;
    width: 250px;
    height: 250px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
    flex-shrink: 0;
}

.cover-info {
    flex: 1;
    padding: 20px;
    margin-left: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);

    .cover-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cover-title {
        flex: 1;
        font-size: 24px;
        font-weight: bold;
        height: 34px;
        line-height: 34px;

        .icon-dj {
            padding-right: 10px;
            color: var(--color-text-height);
        }
    }
}
.cover-author-tags {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.cover-author {
    padding: 15px 0 10px;

    .cover-avatar {
        display: inline-block;
        width: 32px;
        height: 32px;
        border-radius: 100%;
        vertical-align: top;
    }

    .cover-name, .cover-date {
        display: inline-block;
        padding: 0 10px;
        line-height: 32px;
    }

    .cover-date {
        color: var(--color-text);
    }
}
.cover-playCount, .cover-collect, .cover-comment {
    display: inline-block;
    padding: 0 20px 5px 0;
    line-height: 16px;
    font-size: 14px;
    color: var(--color-text);

    i {
        vertical-align: top;
    }
}
.cover-desc {
    position: relative;

    h5 {
        padding: 25px 0 5px;
        line-height: 20px;
        font-size: 14px;
        color: var(--color-text-main);
    }

    p {
        line-height: 22px;
        font-size: 14px;
        color: var(--color-text);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        word-break: break-all;
    }
}
.song-main {
    position: relative;
    padding: 0 20px;
    margin-top: 25px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgba(0,0,0,.05)
}
.song-header {
    display: flex;
    padding: 30px 0 10px;

    h4 {
        flex: 1;
        font-size: 20px;
        line-height: 40px;

        em {
            display: inline-block;
            padding-left: 10px;
            font-size: 12px;
            line-height: 14px;
            font-style: normal;
            font-weight: normal;
            color: #666;
            vertical-align: baseline;
        }
    }

    span {
        display: flex;
        line-height: 16px;
        align-items: center;
        justify-content: center;
        border-radius: 50px;
        padding: 7px 20px;
        cursor: pointer;
        margin: 5px 0 5px 15px;
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

    .collect.active, .collect.active i {
        color: var(--color-text-height);
    }
}

.type-main {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 0 -10px;
}
.type-item {
    display: flex;
    width: calc(100% - 20px);
    padding: 10px 20px;
    margin: 0 10px 20px;
    background: #fff;
    border-radius: 12px;
    opacity: .8;
    cursor: pointer;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
    transition: all .2s;

    .item-img {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        margin-right: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgb(0 0 0 / 12%);
    }

    .item-info {
        flex: 1;
        width: calc(100% - 75px);
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .item-title {
        width: 100%;
        font-weight: bold;
        line-height: 22px;
        font-size: 15px;
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        vertical-align: top;
    }

    .item-time {
        font-size: 12px;
        line-height: 18px;
        color: var(--color-text);
    }

    .item-rcmdtext {
        font-size: 12px;
        line-height: 18px;
        color: var(--color-text);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    &:hover {
        opacity: 1;
    }

    &.active {
        opacity: 1;
        background: -moz-linear-gradient(-45deg,  #ffffff 20%, #ffb08e 100%);
        background: -webkit-linear-gradient(-45deg,  #ffffff 20%,#ffb08e 100%);
        background: linear-gradient(135deg,  #ffffff 20%,#ffb08e 100%);
    }
}

.respond-desktop-narrow({
    .dj-aside {
        width: 350px;
    }
});

/* 平板端 */
.respond-tablet({
    .dj-aside {
        width: 280px;
    }
    .cover-img {
        width: 180px;
        height: 180px;
    }
    .cover-info .cover-title {
        font-size: 20px;
    }
    .type-item {
        padding: 8px 12px;
        .item-img {
            width: 50px;
            height: 50px;
        }
        .item-title {
            font-size: 13px;
        }
    }
});

/* 移动端：纵向排列 */
.respond-mobile({
    .dj-container {
        flex-direction: column;
        padding: 20px 0 0 0;
    }
    .dj-aside {
        width: 100%;
        padding-left: 0;
    }
    .aside-title h3 {
        font-size: 18px;
    }
    .type-item {
        padding: 8px 12px;
        margin: 0 5px 10px;
        .item-img {
            width: 48px;
            height: 48px;
            margin-right: 10px;
        }
        .item-title {
            font-size: 13px;
            line-height: 20px;
        }
    }
    .cover {
        flex-direction: column;
    }
    .cover-img {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
    }
    .cover-info {
        margin-left: 0;
        margin-top: 15px;
        padding: 15px;
    }
    .cover-info .cover-title {
        font-size: 18px;
        line-height: 26px;
    }
    .cover-desc h5 {
        padding: 15px 0 5px;
    }
    .song-main {
        padding: 0 10px;
    }
    .song-header {
        padding: 20px 0 10px;
        flex-wrap: wrap;
        h4 {
            font-size: 16px;
            line-height: 32px;
        }
        span {
            padding: 5px 12px;
            font-size: 12px;
            margin: 3px 0 3px 8px;
        }
    }
});
</style>
