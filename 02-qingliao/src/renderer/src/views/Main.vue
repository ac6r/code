<template>
  <div class="main">
    <div class="left-sider">
      <div></div>
      <div class="menu-list">
        <template v-for="item in menuList" :key="item.path">
          <div
            :class="['tab-item iconfont', item.icon, item.path === currentMenu.path ? 'active' : '']"
            v-if="item.Position === 'top'"
            @click="changeMenu(item)"
          ></div>
        </template>
      </div>

      <!-- 账号切换器 -->
      <div class="account-switcher">
        <el-popover
          placement="right-start"
          :width="210"
          trigger="click"
          :show-arrow="false"
          popper-class="account-popover"
        >
          <template #reference>
            <div class="current-account" title="切换账号">
              <img
                v-if="userInfoStore.userInfo.avatar"
                :src="userInfoStore.userInfo.avatar"
                class="switcher-avatar-img"
              />
              <div v-else class="switcher-avatar-default">
                {{ (userInfoStore.currentNickName || '?')[0] }}
              </div>
            </div>
          </template>
          <div class="account-list">
            <div class="popover-title">切换账号</div>
            <div
              v-for="account in switchableAccounts"
              :key="account.userId"
              :class="['account-item', { active: account.userId === userInfoStore.currentUserId }]"
              @click="handleSwitchAccount(account)"
            >
              <img
                v-if="account.avatar"
                :src="account.avatar"
                class="account-avatar-img"
              />
              <div v-else class="account-avatar-default">
                {{ (account.nickName || '?')[0] }}
              </div>
              <div class="account-info">
                <div class="account-name">{{ account.nickName }}</div>
                <div class="account-email">{{ account.email }}</div>
              </div>
              <span v-if="account.userId === userInfoStore.currentUserId" class="current-badge">当前</span>
            </div>
          </div>
        </el-popover>
      </div>

      <div class="menu-list menu-bottom">
        <template v-for="item in menuList" :key="item.path">
          <div
            :class="['tab-item iconfont', item.icon, item.path === currentMenu.path ? 'active' : '']"
            v-if="item.Position === 'bottom'"
            @click="changeMenu(item)"
          ></div>
        </template>
      </div>
    </div>
    <!-- 一级路由出口：只渲染 二级路由(contact/chat/setting) -->
    <div class="right-container">
      <router-view />
    </div>
  </div>
  <win-op></win-op>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import WinOp from '../components/WinOp.vue';
import { useUserInfoStore } from '../stores/UserinfoStore';

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

const menuList = ref([
  {
    name: 'chat',
    icon: 'icon-chat',
    path: '/main/chat',
    countKey: 'chatCount',
    Position: 'top'
  },
  {
    name: 'contact',
    icon: 'icon-user',
    path: '/main/contact',
    countKey: 'contactApplyCount',
    Position: 'top'
  },
  {
    name: 'mysetting',
    icon: 'icon-more2',
    path: '/main/setting',
    Position: 'bottom'
  },
])
const currentMenu = ref(menuList.value[0])

// 可切换的账号列表
const switchableAccounts = computed(() => {
  const accounts = [...userInfoStore.accounts]
  // 确保当前账号在列表中
  if (userInfoStore.currentUserId && !accounts.find(a => a.userId === userInfoStore.currentUserId)) {
    accounts.unshift({ ...userInfoStore.userInfo })
  }
  return accounts
})

// 切换账号
const handleSwitchAccount = (account) => {
  if (account.userId === userInfoStore.currentUserId) return
  userInfoStore.switchToAccount(account)
}

onMounted(() => {
  // 首次进入时加载所有演示账号
  userInfoStore.loadDemoAccounts()
})

watch(
  ()=>route.path,
  (newPath) =>{
    const matched = menuList.value.find(
      item=>newPath.startsWith(item.path)
    )
    if(matched){
      currentMenu.value = matched
    }
  },
  {immediate:true}
)
const changeMenu = (item) => {
  currentMenu.value = item
  router.push(item.path)
}
</script>

<style lang="scss" scoped>
.main {
  background: #ddd;
  display: flex;
  border-radius: 0px 3px 3px 0px;
  overflow: hidden;
}
.left-sider {
  width: 55px;
  background: #2e2e2e;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 35px;
  border: 1px solid #2e2e2e;
  border-right: none;
  padding-bottom: 10px;
  .menu-list {
    width: 100%;
    flex: 1;
    .tab-item {
      color: #d3d3d3;
      font-size: 20px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
      cursor: pointer;
      font-size: 22px;
      position: relative;
    }
  }
  .tab-item.active {
    color: #07c160;
  }
  .menu-bottom {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
}

/* 账号切换器 */
.account-switcher {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 8px 0;
  margin-bottom: 4px;
}
.current-account {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    border-color: #07c160;
  }
  .switcher-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .switcher-avatar-default {
    width: 100%;
    height: 100%;
    background: #07c160;
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }
}

.right-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #ddd;
  border-left: none;
}
</style>

<!-- 账号切换 popover 样式（非 scoped，因为 popover 渲染在 body 下） -->
<style lang="scss">
.account-popover {
  padding: 0 !important;
  border-radius: 6px !important;
  .popover-title {
    padding: 10px 14px 6px;
    font-size: 13px;
    color: #999;
    border-bottom: 1px solid #eee;
  }
  .account-list {
    max-height: 240px;
    overflow-y: auto;
  }
  .account-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover {
      background: #f5f5f5;
    }
    &.active {
      background: #e8f8ee;
    }
    .account-avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .account-avatar-default {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      background: #07c160;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .account-info {
      flex: 1;
      margin-left: 10px;
      overflow: hidden;
      .account-name {
        font-size: 14px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .account-email {
        font-size: 11px;
        color: #999;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .current-badge {
      font-size: 11px;
      color: #07c160;
      border: 1px solid #07c160;
      border-radius: 3px;
      padding: 1px 6px;
      margin-left: 8px;
      flex-shrink: 0;
    }
  }
}
</style>