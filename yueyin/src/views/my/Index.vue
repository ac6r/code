<template>
    <div class="my-music">
        <!-- 未登录 -->
        <div class="not-login" v-if="!isLogin">
            <div class="empty-state">
                <i class="iconfont icon-empty-main"></i>
                <p class="empty0title">登录后查看我的音乐</p>
                <p class="empty-desc">登录账号,查看收藏歌单</p>
                <el-button type="primary" @click="openLogin">立即登录</el-button>
            </div>
        </div>

        <!-- 已登录 -->
         <div class="logged-in" v-else>
               <!-- 用户信息卡片 -->
                <div class="user-card">
                     <div class="user-avatar">
                        <el-image :src="userInfo.avatarUrl + '?param=120y120'">
                                <template #placeholder>
                                    <div class="image-slot">
                                        <i class="iconfont icon-placeholder"></i>
                                    </div>
                                </template>
                        </el-image>
                     </div>
                     <div class="user-detail">
                        <h2 class="user-nickname">{{ userInfo.nickname }}</h2>
                        <div class="user-stats">
                            <span>关注<em>{{ userInfo.follows }}</em></span>
                            <span>粉丝<em>{{ userInfo.followeds }}</em></span>
                            <span>Lv.<em>{{ userInfo.level || 0 }}</em></span>
                        </div>
                        <div class="user-sign" v-if="userInfo.signnature">{{ userInfo.signnature }}</div>
                     </div>
                </div>
                <template v-if="loading">
                  <Loading />
                </template>
                <!-- 我的歌单 -->
                 <template v-else> 
                          <div class="section" v-if="myPlaylists.length">
                            <div class="section-title">
                                <h3>我的歌单<em>{{ myPlaylists.length }}</em></h3>
                            </div>
                            <play-list :playList="myPlaylists" :loading="false" :num="12" />
                          </div>

                          <!-- 收藏的歌单 -->
                           <div class="section" v-if="subPlaylists.length">
                            <div class="section-title">
                                <h3>收藏的歌单<em>{{ subPlaylists.length }}</em></h3>
                            </div>
                            <play-list :playList="subPlaylists" :loading="false" :num="12" />
                           </div>

                           <!-- 本地收藏的歌单 -->
                            <div class="section" v-if="localFavPlaylists.length">
                    <div class="section-title">
                        <h3>我收藏的歌单 <em>({{ localFavPlaylists.length }})</em></h3>
                    </div>
                    <play-list :playList="localFavPlaylists" :loading="false" :num="12"></play-list>
                </div>

                <!-- 空状态 -->
                 <div class="empty-state" v-if="!myPlaylists.length && !subPlaylists.length && !localFavPlaylists.length">
                    <i class="iconfont icon-empty"></i>
                    <p>还没有歌单，去首页发现好音乐吧</p>
                </div>
                 </template>
         </div>
    </div>
</template>

<script setup>
import PlayList from '@components/PlayList.vue'
import Loading from '@components/Loading.vue'
import { getCurrentInstance,computed,onMounted,reactive,ref,toRefs } from 'vue';
import {usePlayerStore} from "@/stores/player"
import { getLocalFavorites } from '@/mock/favorites'

const {proxy} = getCurrentInstance()
const store = usePlayerStore()

const isLogin = computed(() => store.isLogin)
const userInfo = computed(() => store.userInfo)

const info = reactive ({
    myPlaylists:[],
    subPlaylists: [],
    localFavPlaylists:[],
    loading:true,
})

const loadLocalFavorites = () => {
    info.localFavPlaylists = getLocalFavorites()
}

const openLogin = () => {
    store.setLoginDialog (true)
}

const getUserPlaylists = async () => {
    const user = userInfo.value
    if(!user || !user.userId) {
        info.loading = false
        return
    }

    if(String(user.userId).startsWith('local_')){
        info.loading = false
        return
    }

    try{
        const {data:res} = await proxy.$http.playlistUser({uid:user.userId}) 

        if(res.code === 200) {
            const allList = res.playlist || []
            info.myPlaylists = allList.filter(item => item.userId === user.userId)
            info.subPlaylists = allList.filter(item => item.userId !== user.userId)

        }
    } catch{

    }

    info.loading = false
}

onMounted (() => {
    loadLocalFavorites()
    // 只有登录后才去拉歌单；之前的判断写反了，导致登录用户永远停在 loading，
    // 「我的歌单 / 收藏的歌单」整块渲染不出来。
    if(isLogin.value) {
        getUserPlaylists()
    } else {
        info.loading = false
    }
})

const { myPlaylists, subPlaylists, localFavPlaylists, loading } = toRefs(info)
</script>

<style lang="less" scoped>
.my-music {
    padding-top: 40px;
}

.empty-state {
    padding: 100px 20px;
    text-align: center;

    .icon-empty-main {
        font-size: 120px;
        color: #ddd;
        opacity: 0.6;
    }

    .empty-title {
        font-size: 20px;
        color: #333;
        margin-top: 20px;
        font-weight: bold;
    }

    .empty-desc {
        font-size: 14px;
        color: #999;
        margin: 10px 0 30px;
    }
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
    .my-music {
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
    .empty-state {
        padding: 60px 10px;
    }
    .empty-state .icon-empty-main {
        font-size: 80px;
    }
    .section {
        padding: 12px;
    }
});
</style>
