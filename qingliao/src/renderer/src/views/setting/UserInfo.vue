<template>
  <ContentPanel>
    <div class="show-info" v-if="showType == 0">
      <div class="user-info">
       <Avatar
      :userName="userinfo.nickName"
      :userId="userinfo.userId"
      :userRegion="userinfo.areaName"
      :randomAnimal="true"
      animalType="dog"
    />
        <div class="more-op">
          <el-dropdown placement="bottom-end" trigger="click">
            <span class="el-drop-link">
              <div class="iconfont icon-more"></div>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="changPart(1)">修改个人信息</el-dropdown-item>
                <el-dropdown-item @click="changPart(2)">修改密码</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="part-item">
        <div class="part-title">朋友权限</div>
        <div class="part-content">
          {{ userinfo.joinType === 0 ? '直接加入' : '加我好友时需要验证' }}
        </div>
      </div>

      <div class="part-item">
        <div class="part-title">个性签名</div>
        <div class="part-content">
          {{ userinfo.personalSignature || '这个人很懒，什么都没写' }}
        </div>
      </div>

      <div class="logout">
        <el-button @click="logout">退出登录</el-button>
      </div>
    </div>
    <div v-if="showType == 1 || showType == 2">
        <UserInfoEdit
        v-if="showType == 1"
        @back="showType = 0"
        @updated="handleUserdated"
        ></UserInfoEdit>
        <UserInfoPassword
        v-if="showType == 2"
        @back="showType = 0"
        ></UserInfoPassword>
    </div>
  </ContentPanel>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from '../../components/Avatar.vue'
import ContentPanel from '../../components/ContentPanel.vue'
import Request from '../../utils/Request'// 直接导入 request
import api from '../../utils/Api.js'
import UserBaseInfo from '../../components/UserBaseInfo.vue'
import UserInfoEdit from './UserInfoEdit.vue'
import UserInfoPassword from './UserInfoPassword.vue'

const router = useRouter()
const userinfo = ref({
  joinType: 0,
  personalSignature: ''
})

const getUserInfo = async () => {
  try {
    const result = await Request({
      url: api.getUserInfo,
      showLoading: false
    })
    if (result && result.code === 200) {
      userinfo.value = result.data
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}
const showType = ref(0)
const changPart = (part) =>{
    showType.value = part
}
const logput =()=>{
    router.push('/login')
}
const handleUserdated = (newData) =>{
    userinfo.value = { ...userinfo.value,...newData}
}

const handleSwitchPanel = (type) => {
  // 根据 type 切换右侧面板，这里仅作示例
  console.log('切换到', type)
  // 可通过 emit 或状态管理通知父组件切换视图
}

const logout = () => {
  // 清除 token 等逻辑
  router.push('/login')
}


onMounted(() => {
  getUserInfo()
})

</script>

<style lang="scss" scoped>
.show-info {
  padding: 20px 24px;
}

// 顶部用户信息行：左侧头像+名称，右侧更多操作
.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;

  // 如果 Userinfo 组件内部有特定的外边距，可以重置
  :deep(.user-avatar) {
    margin-right: 12px;
  }

  .more-op {
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }

    .iconfont {
      font-size: 22px;
      color: #666;
    }
  }
}

// 朋友权限 & 个性签名 通用行
.part-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-of-type {
    border-bottom: none;
  }
}

.part-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  margin-right: 20px;
}

.part-content {
  font-size: 14px;
  color: #999;
  text-align: right;
  word-break: break-all;
  flex: 1;
}

// 退出登录按钮区域
.logout {
  margin-top: 40px;
  text-align: center;

  .el-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
    border-radius: 8px;
    background-color: #f56c6c;
    border-color: #f56c6c;
    color: #fff;

    &:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }
}
</style>