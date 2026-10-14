<template>
    <div class="user-page">
        <!-- 加载中 -->
        <template v-if="loading">
            <Loading />
        </template>

        <!-- 没有这个用户 -->
        <template v-else-if="!profile">
            <div class="empty-state">
                <i class="iconfont icon-empty"></i>
                <p>没有找到这位用户</p>
            </div>
        </template>

        <template v-else>
            <!-- 用户信息卡片 -->
            <div class="user-card">
                <div class="user-avatar">
                    <el-image :src="avatar">
                        <template #placeholder>
                            <div class="image-slot">
                                <i class="iconfont icon-placeholder"></i>
                            </div>
                        </template>
                    </el-image>
                </div>
                <div class="user-detail">
                    <h2 class="user-nickname">{{ profile.nickname }}</h2>
                    <div class="user-stats">
                        <span>关注<em>{{ profile.follows || 0 }}</em></span>
                        <span>粉丝<em>{{ profile.followeds || 0 }}</em></span>
                        <span>Lv.<em>{{ profile.level || 0 }}</em></span>
                    </div>
                    <div class="user-sign" v-if="profile.signature">{{ profile.signature }}</div>
                </div>
            </div>

            <!-- TA 的歌单 -->
            <div class="section" v-if="playlists.length">
                <div class="section-title">
                    <h3>TA 的歌单<em>{{ playlists.length }}</em></h3>
                </div>
                <play-list :playList="playlists" :loading="false" :num="12" />
            </div>

            <div class="empty-state" v-else>
                <i class="iconfont icon-empty"></i>
                <p>TA 还没有公开的歌单</p>
            </div>
        </template>
    </div>
</template>

<script setup>
import PlayList from '@components/PlayList.vue'
import Loading from '@components/Loading.vue'
import { computed, getCurrentInstance, onMounted, reactive, toRefs, watch } from 'vue'
import { useRoute } from 'vue-router'

const { proxy } = getCurrentInstance()
const route = useRoute()

const info = reactive({
    profile: null,
    playlists: [],
    loading: true
})

const getProfile = async () => {
    const uid = route.query.id
    if (!uid) {
        info.profile = null
        info.playlists = []
        info.loading = false
        return
    }

    info.loading = true

    // 用户资料
    try {
        const { data: res } = await proxy.$http.getUserInfo({ uid })
        info.profile = res.code === 200 ? res.profile || null : null
    } catch {
        info.profile = null
    }

    // TA 的歌单
    try {
        const { data: res } = await proxy.$http.playlistUser({ uid })
        info.playlists = res.code === 200 ? res.playlist || [] : []
    } catch {
        info.playlists = []
    }

    info.loading = false
}

onMounted(getProfile)

// 从一位用户的页面点进另一位用户时，路由参数变化但组件复用，需要重新拉取
watch(
    () => route.query.id,
    () => getProfile()
)

const { profile, playlists, loading } = toRefs(info)

// 头像地址统一补上尺寸参数，避免加载原图
const avatar = computed(() => (profile.value?.avatarUrl || '') + '?param=200y200')
</script>

<style lang="less" scoped>
.user-page {
    padding-top: 40px;
}

.user-card {
    display: flex;
    padding: 30px;
    margin-bottom: 25px;
    background: linear-gradient(135deg, #ff641e 0%, #ff8a50 100%);
    border-radius: 12px;
    box-shadow: 0 20px 27px rgba(255, 100, 30, 0.2);

    .user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 100%;
        overflow: hidden;
        border: 3px solid rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
    }

    .user-detail {
        flex: 1;
        padding-left: 25px;
        color: #fff;
    }

    .user-nickname {
        font-size: 24px;
        font-weight: bold;
        line-height: 32px;
        padding-bottom: 8px;
    }

    .user-stats {
        padding-bottom: 8px;

        span {
            display: inline-block;
            padding-right: 25px;
            font-size: 14px;
            opacity: 0.9;

            em {
                font-style: normal;
                font-weight: bold;
                padding-left: 3px;
            }
        }
    }

    .user-sign {
        font-size: 13px;
        opacity: 0.8;
        line-height: 20px;
    }
}

.section {
    padding: 20px;
    margin-bottom: 25px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);

    .section-title {
        h3 {
            font-size: 20px;
            line-height: 30px;
            padding-bottom: 10px;

            em {
                display: inline-block;
                padding-left: 10px;
                font-size: 12px;
                line-height: 14px;
                font-style: normal;
                font-weight: normal;
                color: #999;
                vertical-align: baseline;
            }
        }
    }
}

.empty-state {
    padding: 100px 20px;
    text-align: center;

    .icon-empty {
        font-size: 120px;
        color: #ddd;
        opacity: 0.6;
    }

    p {
        font-size: 14px;
        color: #999;
        margin-top: 20px;
    }
}

/* 平板端 */
.respond-tablet({
    .user-card {
        padding: 20px;
    }
    .user-nickname {
        font-size: 20px;
    }
});

/* 移动端 */
.respond-mobile({
    .user-page {
        padding-top: 20px;
    }
    .user-card {
        padding: 20px 15px;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .user-detail {
        padding-left: 0;
        padding-top: 15px;
    }
    .user-nickname {
        font-size: 18px;
    }
    .user-stats span {
        padding-right: 15px;
        font-size: 12px;
    }
    .section {
        padding: 12px;
    }
    .empty-state {
        padding: 60px 10px;
    }
    .empty-state .icon-empty {
        font-size: 80px;
    }
});
</style>
