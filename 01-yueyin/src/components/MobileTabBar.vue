<template>
<div class="mobile-tab-bar">
    <router-link
    v-for="item in tabs"
    :key="item.path"
    :to="'/' + item.path"
    :class="['tab-item', {active:isActive(item.path)}]"
    >
       <i :class="['iconfont', `icon-${item.path}`]"></i>
       <span>{{ item.name }}</span>
    </router-link>
    <div class="tab-item" @click="showLogin">
        <i class="iconfont icon-my"></i>
        <span>我的</span>
    </div>
</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {usePlayerStore} from "@/stores/player"

const route = useRoute()
const router = useRouter()
const store = usePlayerStore()

const tabs = [
    { name: '首页', path: 'index' },
    { name: '排行榜', path: 'rank' },
    { name: '歌单', path: 'playlist' },
    { name: 'MV', path: 'mvlist' },
]

const isActive = (path) => {
    return route.path.indexOf(path) >= 0
}

const isLogin = computed(() => store.isLogin)

const showLogin = () => {
    if(isLogin.value) {
        router.push({ path: '/my' })
    } else {
        store.setLoginDialog( true)
    }
}
</script>

<style lang="less" scoped>
.mobile-tab-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 55px;
    background: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
    justify-content: space-around;
    align-items: center;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    text-decoration: none;
    color: var(--color-text);

    .iconfont {
        font-size: 22px;
        margin-bottom: 2px;
    }

    span {
        font-size: 10px;
        line-height: 1;
    }

    &.active {
        color: var(--color-text-height);

        .iconfont {
            color: var(--color-text-height);
        }
    }
}

.respond-mobile({
    .mobile-tab-bar {
        display: flex;
    }
});
</style>
 