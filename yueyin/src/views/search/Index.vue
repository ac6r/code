<template>
    <div class="search-result">
        <div class="list-head">
            <h2>
                搜索<em v-if="keyword">“{{ keyword }}”</em>
            </h2>
            <div class="type">
                <span
                v-for="(item, index) in typeList"
                :key="item.type"
                :class="index === typeIndex ? 'active' : ''"
                @click="selectType(index)"
                >
                    {{ item.label }}<em class="count" v-if="countMap[item.countKey]">{{ formatCount(countMap[item.countKey]) }}</em>
                </span>
            </div>
        </div>

        <!-- 没有关键词 -->
        <div class="empty" v-if="!keyword">
            <i class="iconfont icon-search"></i>
            <p>输入歌名、歌手或专辑开始搜索</p>
        </div>

        <template v-else>
            <div
            class="result-wrapper"
            v-infinite-scroll="loadMore"
            infinite-scroll-disabled="noMore || loading || loadingMore"
            infinite-scroll-distance="80"
            >
                <!-- 单曲 -->
                <song-list
                v-if="typeIndex === 0 && songList.length"
                :songList="songList"
                :stripe="true"
                />

                <!-- 歌手 -->
                <div class="artist-list" v-else-if="typeIndex === 1 && artistList.length">
                    <artist-item v-for="item in artistList" :key="item.id" :item="item" />
                </div>

                <!-- 专辑 -->
                <album-list
                v-else-if="typeIndex === 2 && albumList.length"
                :albumList="albumList"
                :loading="false"
                :num="12"
                />

                <!-- 歌单 -->
                <play-list
                v-else-if="typeIndex === 3 && playList.length"
                :playList="playList"
                :loading="false"
                :num="12"
                />

                <!-- MV -->
                <mv-list
                v-else-if="typeIndex === 4 && mvList.length"
                :mvList="mvList"
                :loading="false"
                :num="10"
                />

                <!-- 加载中 -->
                <Loading v-if="loading || loadingMore" />

                <!-- 空结果 -->
                <div class="empty" v-else-if="!currentList.length">
                    <i class="iconfont icon-search"></i>
                    <p>没有找到与“{{ keyword }}”相关的{{ typeList[typeIndex].label }}</p>
                </div>

                <!-- 到底了 -->
                <div class="load-end" v-else-if="noMore">
                    <span>— 已经到底啦 —</span>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import SongList from '@components/SongList.vue'
import ArtistItem from '@components/ArtistItem.vue'
import AlbumList from '@components/AlbumList.vue'
import PlayList from '@components/PlayList.vue'
import MvList from '@components/MvList.vue'
import Loading from '@components/Loading.vue'

import { onMounted, getCurrentInstance, reactive, computed, watch, toRefs } from 'vue'
import { useRoute } from 'vue-router'

const { proxy } = getCurrentInstance()
const route = useRoute()

// cloudsearch 的 type 取值：1 单曲 / 10 专辑 / 100 歌手 / 1000 歌单 / 1004 MV
const typeList = [
    { label: '单曲', type: 1, dataKey: 'songs', countKey: 'songCount' },
    { label: '歌手', type: 100, dataKey: 'artists', countKey: 'artistCount' },
    { label: '专辑', type: 10, dataKey: 'albums', countKey: 'albumCount' },
    { label: '歌单', type: 1000, dataKey: 'playlists', countKey: 'playlistCount' },
    { label: 'MV', type: 1004, dataKey: 'mvs', countKey: 'mvCount' },
]

const LIMIT = 30

const info = reactive({
    keyword: '',
    typeIndex: 0,
    countMap: {},
    songList: [],
    artistList: [],
    albumList: [],
    playList: [],
    mvList: [],
    loading: true,      // 首次加载当前分类
    loadingMore: false, // 加载下一页
    noMore: false,      // 没有更多了
    offset: 0,
})

const currentList = computed(() => {
    return [info.songList, info.artistList, info.albumList, info.playList, info.mvList][info.typeIndex]
})

const formatCount = (n) => (n > 9999 ? '9999+' : n)

// 各分类的字段映射：搜索接口返回的字段名和列表组件期望的不完全一致
const mappers = {
    // 单曲用 v2 字段（ar / al / alia），每首歌自带 privilege，需要抽出来对齐
    songs: (raw) => proxy.$utils.formatSongs(raw, raw.map((s) => s.privilege || { cp: 1 })),
    // 列表组件读的是 fansCount，搜索接口给的是 fansSize（还可能为 null）
    artists: (raw) => raw.map((item) => ({
        ...item,
        fansCount: item.fansSize || item.fansCount || 0,
    })),
    // 搜索返回的歌单没有 tags，用 officialTags 兜底，避免标签区渲染不出来
    playlists: (raw) => raw.map((item) => ({
        ...item,
        tags: Array.isArray(item.officialTags) && item.officialTags.length
            ? item.officialTags
            : [],
    })),
    albums: (raw) => raw,
    mvs: (raw) => raw,
}

const applyResult = (dataKey, raw) => {
    const list = mappers[dataKey](raw)
    if (dataKey === 'songs') {
        info.songList = info.offset !== 0 ? [...info.songList, ...list] : list
    } else if (dataKey === 'artists') {
        info.artistList = info.offset !== 0 ? [...info.artistList, ...list] : list
    } else if (dataKey === 'albums') {
        info.albumList = info.offset !== 0 ? [...info.albumList, ...list] : list
    } else if (dataKey === 'playlists') {
        info.playList = info.offset !== 0 ? [...info.playList, ...list] : list
    } else {
        info.mvList = info.offset !== 0 ? [...info.mvList, ...list] : list
    }
}

const resetLists = () => {
    info.songList = []
    info.artistList = []
    info.albumList = []
    info.playList = []
    info.mvList = []
    info.offset = 0
    info.noMore = false
}

const getSearch = async () => {
    if (!info.keyword) {
        info.loading = false
        return
    }

    const current = typeList[info.typeIndex]
    info.loadingMore = true

    try {
        const { data: res } = await proxy.$http.cloudsearch({
            keywords: info.keyword,
            limit: LIMIT,
            offset: info.offset,
            type: current.type,
        })

        if (res.code !== 200) {
            info.noMore = true
            return proxy.$msg.error('数据请求失败')
        }

        const result = res.result || {}
        const raw = result[current.dataKey] || []
        const total = result[current.countKey] || 0

        info.countMap = { ...info.countMap, [current.countKey]: total }
        applyResult(current.dataKey, raw)

        // 返回条数为 0，或已取满，都说明没有更多了
        info.noMore = raw.length === 0 || info.offset + raw.length >= total
    } catch {
        info.noMore = true
        proxy.$msg.error('数据请求失败')
    } finally {
        info.loading = false
        info.loadingMore = false
    }
}

// 切换分类
const selectType = (index) => {
    if (index === info.typeIndex) return
    info.typeIndex = index
    info.loading = true
    resetLists()
    getSearch()
}

// 滚动到底部加载下一页
const loadMore = () => {
    if (info.noMore || info.loadingMore || !info.keyword) return
    info.offset = currentList.value.length
    getSearch()
}

// 顶部搜索框重新搜索时，地址栏 query 变化，这里同步刷新
watch(() => route.query.key, (val) => {
    const key = val || ''
    if (key === info.keyword) return
    info.keyword = key
    info.loading = true
    resetLists()
    getSearch()
})

onMounted(() => {
    info.keyword = route.query.key || ''
    info.loading = true
    getSearch()
})

const { keyword, typeIndex, countMap, songList, artistList, albumList, playList, mvList, loading, loadingMore, noMore } = toRefs(info)
</script>

<style lang="less" scoped>
.search-result {
    padding-top: 40px;
}

.list-head {
    display: flex;
    padding: 15px 0;
    align-items: center;

    h2 {
        font-size: 24px;
        line-height: 30px;
        max-width: 40%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        em {
            font-style: normal;
        }
    }

    .type {
        flex: 1;
        padding: 5px 40px;

        span {
            position: relative;
            z-index: 9;
            display: inline-block;
            height: 20px;
            line-height: 20px;
            margin-right: 34px;
            font-weight: 300;
            color: #333;
            cursor: pointer;

            .count {
                font-style: normal;
                font-size: 12px;
                color: var(--color-text);
                vertical-align: top;
                padding-left: 2px;
            }

            &.active {
                font-weight: 600;
                color: #000;

                &::after {
                    position: absolute;
                    content: "";
                    left: 0;
                    bottom: 1px;
                    width: 100%;
                    height: 6px;
                    background: var(--color-text-height);
                    z-index: -1;
                }
            }
        }
    }
}

.result-wrapper {
    min-height: 400px;
    padding-bottom: 40px;
}

.artist-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-right: -40px;
}

.empty {
    padding: 100px 20px;
    text-align: center;
    color: var(--color-text);

    .iconfont {
        font-size: 60px;
        color: #ddd;
    }

    p {
        padding-top: 20px;
        font-size: 14px;
    }
}

.load-end {
    padding: 20px 0;
    text-align: center;
    font-size: 13px;
    color: var(--color-text);
}

/* 平板端 */
.respond-tablet({
    .list-head {
        h2 {
            font-size: 20px;
            line-height: 26px;
            max-width: 32%;
        }
        .type {
            padding: 4px 20px;
            span {
                margin-right: 22px;
            }
        }
    }
});

/* 移动端 */
.respond-mobile({
    .search-result {
        padding-top: 20px;
    }
    .list-head {
        display: block;
        padding: 10px 0;

        h2 {
            font-size: 18px;
            line-height: 24px;
            max-width: 100%;
            margin-bottom: 10px;
        }
        .type {
            padding: 0;
            span {
                font-size: 13px;
                margin-right: 18px;
            }
        }
    }
    .empty {
        padding: 60px 10px;
    }
});
</style>
