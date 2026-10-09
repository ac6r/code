<template>
  <div>
    <Layout>
      <template #left-content>
        <div class="drag-panel drag"></div>
        <div class="top-search">
          <el-input clearable placeholder="搜索" v-model="searchKey" size="small" @keyup="search">
            <template #suffix>
              <span class="iconfont icon-search"></span>
            </template>
          </el-input>
        </div>
        <div class="contact-list">
          <template v-for="item in partList" :key="item.partName">
            <div class="part-title">{{ item.partName }}</div>
            <div class="part-list">
              <div
                v-for="sub in item.children"
                :key="sub.path"
                :class="['part-item', sub.path === $route.path ? 'active' : '']"
                @click="partJump(sub)"
              >
                <i :class="['iconfont', sub.icon]" :style="{background: sub.iconBgColor}"></i>
                <div class="text">{{ sub.name }}</div>
              </div>
              <div
                v-for="contact in item.contactData"
                :key="contact.contactId"
                class="part-item"
                @click="gotoContactDetail(contact, item)"
              >
                <!-- 头像：点击弹出详情，阻止冒泡 -->
                <div
                  class="contact-avatar"
                  @click.stop="handleShowUserDetail({
                    contactId: contact.contactId,
                    contactType: item.partName === '我加入的群聊' ? 'GROUP' : 'USER',
                    nickName: contact.contactName,
                    areaName: '-'
                  })"
                >
                  <Avatar
                    :userId="contact.contactId"
                    :userName="contact.contactName"
                    :hideButton="true"
                    :randomAnimal="true"
                    animalType="dog"
                  />
                </div>
                <div class="text">{{ contact.contactName }}</div>
              </div>
              <template v-if="item.contactData && item.contactData.length === 0">
                <div class="no-data">{{ item.emptyMsg }}</div>
              </template>
            </div>
          </template>
        </div>
      </template>
      <template #right-content>
        <div class="title-panel drag">{{ rightTitle }}</div>
        <router-view :key="$route.fullPath" />
      </template>
    </Layout>
    <!-- 用户详情弹窗 -->
    <el-dialog v-model="showUserDialog" width="360px">
      <Avatar
        :avatar="currentUser.avatar || ''"
        :userName="currentUser.nickName"
        :userId="currentUser.contactId"
        :userRegion="currentUser.areaName"
        :buttonText="'发送消息'"
        @action="handleSendMessage"
      />
    </el-dialog>
  </div>
</template>
<script setup>
import Layout from '../../components/Layout.vue';
import Avatar from '../../components/Avatar.vue'; // 只需要导入Avatar，不用其他多余组件
import { ref,onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../utils/Api.js';
import request from '../../utils/Request.js'
import { ElMessage } from 'element-plus';
import {fixedUsers,fixedGroups} from '../../data/fixedContacts.js'
import { useContacts } from '../../stores/contacts.js';
const router = useRouter()
const route = useRoute()
const searchKey = ref('')
const rightTitle = ref('')
const abortControllers = ref([])
const{updateContacts} = useContacts()

// 弹窗相关变量
const showUserDialog = ref(false)
const currentUser = ref({})

// 左侧列表数据，包含模拟的好友和群聊
const partList = ref([
  {
    partName: '新朋友',
    children: [
      {
        name: '搜好友',
        icon: 'icon-search',
        iconBgColor: '#fa9d3b',
        path: '/main/contact/search'
      },
      {
        name: '新的朋友',
        icon: 'icon-plane',
        iconBgColor: '#08bf61',
        path: '/main/contact/blank',
        showTitle: true,
        countKey: 'contactApplyCount'
      }
    ],
    contactData: []
  },
  {
    partName: '我的群聊',
    children: [
      {
        name: '新建群聊',
        icon: 'icon-add-group',
        iconBgColor: '#1485ee',
        path: '/main/contact/creatGroup',
        showTitle:true
      }
    ],
    contactId: 'groupId',
    contactName: 'groupName',
    showTitle: true,
    contactData: [],
    contactPath: '/contact/groupDetail'
  },
  {
    partName: '我加入的群聊',
    children: [],
    contactId: 'contactId',
    contactName: 'contactName',
    showTitle: true,
    contactPath: '/contact/groupDetail',
    emptyMsg: '暂未加入群聊'
  },
  {
    partName: '我的好友',
    children: [],
    contactId: 'contactId',
    contactName: 'contactName',
    contactPath: '/contact/userDetail',
    emptyMsg: '暂无好友'
  }
])
partList.value[2].contactData = fixedGroups.map(g =>({
   contactId:g.contactId,
   contactName:g.nickName,
   contactType:'GROUP'
}))
partList.value[3].contactData = fixedUsers.map(u =>({
  contactId:u.contactId,
  contactName:u.nickName,
  contactType:'USER'
}))
// 点击头像弹出详情
const handleShowUserDetail = (user) => {
  currentUser.value = user
  showUserDialog.value = true
}

// 点击发送消息，跳转到聊天窗口
const handleSendMessage = () => {
  router.push(`/main/chat/${currentUser.value.contactId}`)
  showUserDialog.value = false
  ElMessage.success('已跳转到聊天窗口')
}

const search = () => {}
const partJump = (data) => {
  rightTitle.value = data.showTitle ? data.name : ''
  router.push(data.path)
}
const gotoContactDetail = (contact) => {
 router.push(`/main/chat/${contact.contactId}`)
}
// 点击快速添加，跳转到搜索页
const handleClickFixedUser = (user) => {
  router.push({
    path: '/main/contact/search',
    query: {
      userInfo: JSON.stringify(user)
    }
  })
}

const loadContact = async (contactType) =>{
  const controller = new AbortController()
  abortControllers.value.push(controller)
  
  const params = { contactType };
  try {
    const result = await request({
        url: api.loadContact,
        method: 'POST',
        params: params,
        signal: controller.signal 
      });
      if(!result){
        return
      }
      const serverData = result.data || []
      if(contactType === 'GROUP') {
       const fixedMapped = fixedGroups.map(g=>({contactId:g.contactId,contactName:g.nickName,contactType:'GROUP'}))
       const map = new Map()
       fixedMapped.forEach(item => map.set(item.contactId,item))
       serverData.forEach(item => map.set(item.contactId,item))
       partList.value[2].contactData = Array.from(map.values())
       updateContacts(partList.value[2].contactData,'GROUP')

      }else if (contactType === 'USER') {
       const fixedMapped = fixedUsers.map(u => ({ contactId: u.contactId, contactName: u.nickName, contactType: 'USER' }))
      const map = new Map()
      fixedMapped.forEach(item => map.set(item.contactId, item))
      serverData.forEach(item => map.set(item.contactId, item))
      partList.value[3].contactData = Array.from(map.values())
      updateContacts(partList.value[3].contactData,'USER')
      }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(`加载${contactType === 'GROUP' ? '群组' : '好友'}失败:`, err)
    }
  }
}
const handleRefreshContact = (e) => {
 loadContact(e.detail)
}
onMounted(() => {
  loadContact('USER')
  loadContact('GROUP')
  window.addEventListener('refresh-contact-list', handleRefreshContact);
});
onUnmounted(() => {
  window.removeEventListener('refresh-contact-list', handleRefreshContact);
  abortControllers.value.forEach(controller => controller.abort())
})
</script>
<style lang="scss" scoped>
.drag-panel {
  height: 25px;
  background: #f7f7f7;
}
.top-search {
  padding: 0px 10px 9px 10px;
  display: flex;
  align-items: center;
  .iconfont {
    font-size: 12px;
  }
}
.contact-list {
  border-top: 1px solid #ddd;
  height: calc(100vh - 62px);
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
}
.part-title {
  color: #515151;
  padding-left: 10px;
  margin-top: 10px;
}
.part-list {
  border-bottom: 1px solid #d6d6d6;
  .part-item {
    display: flex;
    align-items: center;
    padding: 10px 10px;
    position: relative;
    &:hover {
      cursor: pointer;
      background: #d6d6d7;
    }
    :deep(.iconfont) {
      font-family: "iconfont"!important;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #fff;
      background-color: #1485ee;
    }
    .text {
      flex: 1;
      color: #000000;
      margin-left: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .no-data {
    text-align: center;
    font-size: 12px;
    color: #9d9d9d;
    line-height: 30px;
  }
}
.active {
  background: #c4c4c4;
  &:hover {
    background: #c4c4c4;
  }
}
.title-panel {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  font-size: 18px;
  color: #000000;
}
.contact-avatar {
  width: 35px;
  height: 35px;
  overflow: hidden;
  border-radius: 4px;
  flex-shrink: 0;
  
  :deep(.avatar-card) {
    padding: 0;
  }
  :deep(.avatar-wrapper) {
    margin-bottom: 0;
    gap: 0;
  }
  :deep(.user-info) {
    display: none;       /* 隐藏昵称、ID、地区 */
  }
  :deep(.action-button) {
    display: none;       /* 隐藏按钮 */
  }
  :deep(.avatar-box) {
    width: 35px !important;
    height: 35px !important;
    img {
      width: 35px !important;
      height: 35px !important;
    }
    .default-avatar {
      width: 35px !important;
      height: 35px !important;
    }
  }
}

// 同时调整 .part-item 的布局，确保不破坏原有样式
.part-item {
  .text {
    margin-left: 10px;   // 与头像保持间距
  }
}
</style>