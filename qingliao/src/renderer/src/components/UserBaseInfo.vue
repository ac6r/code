
<template>
  <div class="user-panel">
    <div class="base-avatar">
      <Avatar
        :userId="userInfo?.userId || userInfo?.contactId"
        :userName="userInfo?.nickName"
        :hideButton="true"
        :randomAnimal="true"
        animalType="dog"
      />
    </div>
    <div class="user-info">
      <div class="nick-name">
        {{ userInfo?.nickName }}
        <span v-if="userInfo?.sex == 0" class="iconfont icon-woman"></span>
        <span v-if="userInfo?.sex == 1" class="iconfont icon-man"></span>
      </div>
      <div class="info">ID：{{ userInfo?.userId || userInfo?.contactId }}</div>
      <div class="info" v-if="showArea">地区：{{ userInfo?.areaName }}</div>
    </div>
  </div>
</template>

<script setup>
import Avatar from './Avatar.vue' 

const props = defineProps({
  userInfo: { type: Object, default: () => ({}) },
  showArea: { type: Boolean, default: true }
})
</script>

<style lang="scss" scoped>
.base-avatar {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border-radius: 4px;
  
  :deep(.avatar-card) { padding: 0; }
  :deep(.avatar-wrapper) { margin-bottom: 0; gap: 0; }
  :deep(.user-info) { display: none; }
  :deep(.action-button) { display: none; }
  :deep(.avatar-box) {
    width: 50px !important;
    height: 50px !important;
    img {
      width: 50px !important;
      height: 50px !important;
    }
    .default-avatar {
      width: 50px !important;
      height: 50px !important;
    }
  }
}
.user-info {
  margin-left: 10px;
}
.user-panel {
  display: flex;
  padding-bottom: 20px;
}
.user-info {
  flex: 1;
  margin-left: 10px;
  .nick-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #000000;
    font-size: 16px;
    .iconfont {
      font-size: 13px;
    }
    .icon-man {
      color: #2cb6fe;
    }
    .icon-woman {
      color: #fb7373;
    }
  }
  .info {
    font-size: 12px;
    color: #9e9e9e;
    margin-top: 3px;
  }
}
</style>