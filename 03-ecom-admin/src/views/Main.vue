<script setup>
import CommonAside from '../components/CommonAside.vue';
import CommonHeader from '../components/CommonHeader.vue';
import CommonTabs from '../components/CommonTabs.vue';
</script>


<template>
 <div class="common-layout">
   <el-container class="lay-container">
<!-- 自定义左侧组件 -->
  <common-aside />
 <el-container>
    <el-header class="el-header">
   <common-header />
    </el-header>
     <common-tabs/>
    <main class="right-main">
     <router-view></router-view>
    </main>
 </el-container>
   </el-container>
 </div>
</template>

<style scoped lang="less">
.common-layout,.lay-container{
   height: 100%;
}
.el-header{
   background-color: #333;
}
</style>