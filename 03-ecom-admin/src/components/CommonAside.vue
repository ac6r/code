<template>
    <el-aside :width="width">
     <el-menu
     :collapse-transition="false"
     :collapse="isCollapse"
     :default-active="activeMenu"
     >
      <h3 v-show="!isCollapse">通用后台管理系统</h3>
      <h3 v-show="isCollapse">后台</h3>
       <el-menu-item 
       v-for="item in nochildren"
       :index="item.path"
       :key="item.path"
       @click="handleMenu(item)"
       >
          <component class="icons" :is="item.icon"></component>
          <span>{{ item.label }}</span>
        </el-menu-item>
        <el-sub-menu
        v-for="item in haschildren"
       :index="item.path"
       :key="item.path"
        >
       <template #title>
          <component class="icons" :is="item.icon"></component>
          <span>{{ item.label }}</span> 
          </template>
          <el-menu-item-group>
            <el-menu-item
            v-for="(subItem,subIndex) in item.children"
            :index="subItem.path"
            :key="subItem.path"
            @click="handleMenu(subItem)"
            >
            <component class="icons" :is="subItem.icon"></component>
          <span>{{ subItem.label }}</span> </el-menu-item>
          </el-menu-item-group>
            
           
        </el-sub-menu>
       
      </el-menu>
    </el-aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import { useAllDataStore } from '../store'

// 完整的菜单配置数据
const list = ref([
  {
    path: '/home',
    name: 'home',
    label: '首页',
    icon: 'house',
    url: 'Home'
  },
  {
    path: '/mall',
    name: 'mall',
    label: '商品管理',
    icon: 'video-play',
    url: 'Mall'
  },
  {
    path: '/user',
    name: 'user',
    label: '用户管理',
    icon: 'user',
    url: 'User'
  },
  {
    path: '/other',
    label: '其他',
    icon: 'location',
    children: [
      {
        path: '/page1',
        name: 'page1',
        label: '页面1',
        icon: 'setting',
        url: 'Page1'
      },
      {
        path: '/page2',
        name: 'page2',
        label: '页面2',
        icon: 'setting',
        url: 'Page2'
      }
    ]
  }
])
const nochildren = computed(()=>list.value.filter(item=>!item.children))
const haschildren = computed(()=>list.value.filter(item=>item.children))
const store = useAllDataStore()
const isCollapse = computed(()=>store.state.isCollapse)
const width = computed(()=>store.state.isCollapse ? '64px':'180px')
const router = useRouter()
const route = useRoute()
const activeMenu = computed(()=>route.path)
const handleMenu = (item)=>{
  router.push(item.path)
  store.selectMenu(item)
}
</script>
<style scoped>
.icons{
  width: 18px;
  height: 18px;
  margin-right: 5px;
}
.el-aside{
  height: 100vh;
  background-color: #545c64;
}
/* 穿透修改菜单文字颜色 */
:deep(.el-menu) {
  background-color: #545c64;
  color: #fff;
  border-right: none;
}
:deep(.el-menu-item) {
  color: #fff;
}
:deep(.el-sub-menu__title) {
  color: #fff;
}
h3{
  line-height: 48px;
  color: #fff;
  text-align: center;
}
</style>