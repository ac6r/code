<template>
  <div class="avatar-card">
    <div class="avatar-wrapper">
      <div class="avatar-box">
        <img :src="displayAvatar" alt="用户头像" @error="handleAvatarError" />
      </div>

      <div class="user-info">
        <div class="user-name">{{ userName }}</div>
        <div class="user-id">ID: {{ userId }}</div>
        <div class="user-region">地区: {{ userRegion }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { avatarDataUri } from '../utils/avatar'

const props = defineProps({
  avatar: { type: String, default: '' },
  userName: { type: String, required: true },
  userId: { type: [String, Number], required: true },
  userRegion: { type: String, default: '-' },
  // 兼容旧调用（模板本身不含按钮）
  hideButton: { type: Boolean, default: false },
  // 兼容旧调用：随机动物头像已改为本地生成，这两个参数不再使用
  randomAnimal: { type: Boolean, default: false },
  animalType: { type: String, default: 'dog' }
})

const avatarError = ref(false)

// 本地生成头像：由昵称 + ID 决定，稳定、即时、离线可用
const localAvatar = computed(() => avatarDataUri(props.userName, props.userId))

// 有外部头像就用；没有或加载失败时一律回退到本地头像，绝不显示空白
const displayAvatar = computed(() => {
  if (props.avatar && !avatarError.value) return props.avatar
  return localAvatar.value
})

watch(
  () => props.avatar,
  () => {
    avatarError.value = false
  }
)

const handleAvatarError = () => {
  avatarError.value = true
}
</script>

<style lang="scss" scoped>
.avatar-card {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.avatar-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-box {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 4px;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.user-info {
  flex: 1;
  .user-name {
    font-size: 16px;
    font-weight: 500;
    color: #000;
    margin-bottom: 8px;
  }
  .user-id,
  .user-region {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }
}

.action-button {
  text-align: center;
}
</style>
