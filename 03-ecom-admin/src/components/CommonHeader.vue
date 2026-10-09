<template>
  <div class="header">
    <div class="l-content">
       <el-button size="small" @click="handleCollapse">
        <component class="icons" is="Menu"></component>
       </el-button>
     <el-breadcrumb separator="/" class="bread">
       <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
       <el-breadcrumb-item
         v-for="item in matchedRoutes"
         :key="item.path"
         :to="{ path: item.path }"
       >
         {{ item.meta?.title || item.name }}
       </el-breadcrumb-item>
     </el-breadcrumb>
    </div>
    <div class="r-content">
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <img :src="getImageUrl('touxiang')" class="user" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="logout">退出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAllDataStore } from '../store'
import { ElMessage } from 'element-plus'
const router = useRouter()
const route = useRoute()
const getImageUrl = (name) => {
  return new URL(`../assets/img/${name}.png`, import.meta.url).href
}
const store = useAllDataStore()
const handleCollapse = ()=>{
  store.state.isCollapse = !store.state.isCollapse
}
const matchedRoutes = computed(() => {
  return route.matched.filter(item => item.path !== '/' && item.name !== 'main')
})
const handleCommand = (command) => {
  if (command === 'logout') {
    store.clearState()
    router.push('/login')
    ElMessage.success('已退出登录')
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}
</script>

<style scoped>
.header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #333;
}
.icons{
  width: 20px;
  height: 20px;
}
.bread{
  margin-left: 5px;
}
.l-content{
  display: flex;
  align-items: center;
}
.r-content .user{
 width: 40px;
 height: 40px;
 border-radius: 50%;
}
:deep(.bread span){
  color: #fff !important;
  cursor: pointer !important;
}
</style>