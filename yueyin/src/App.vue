
<template>
   <el-container>
      <el-aside>
         <Sidebar />
      </el-aside>
      <el-main>
         <Header />
         <RouterView></RouterView>
      </el-main>
      <Login v-show="store.loginDialogVisible" />
      <play-bar></play-bar>
      <mobile-tab-bar></mobile-tab-bar>
   </el-container>
</template>

<script setup>
import { usePlayerStore } from '@/stores/player';
import { computed,onMounted,ref } from 'vue';

import Sidebar from '@components/Sidebar.vue';
import Header from '@components/Header.vue';
import Login from '@components/Login.vue';
import Playbar from '@components/PlayBarTmp/PlayBar.vue';
import MobileTabBar from '@components/MobileTabBar.vue';

const store = usePlayerStore()
const loginDialogVisible = computed(() => store.loginDialogVisible)

 onMounted(() => {
        const $script = document.createElement('script');

            $script.src = 'https://s9.cnzz.com/z_stat.php?id=1280869713&web_id=1280869713';
            $script.type = 'text/javascript';
            document.body.appendChild($script);
    })
</script>

<style>
</style>