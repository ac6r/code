<template>
  <div class="avatar-card">
    <div class="avatar-wrapper">
      <!-- 点击头像区域触发换图（如果启用了随机动物） -->
      <div 
        class="avatar-box" 
        @click="refreshIfRandom"
        :style="{ cursor: randomAnimal ? 'pointer' : 'default' }"
      >
        <img 
          :src="currentAvatar" 
          alt="用户头像" 
          @error="handleAvatarError"
          v-if="!avatarError"
        />
        <div class="default-avatar" v-else></div>
        <!-- 刷新图标（仅当随机模式） -->
        <div v-if="randomAnimal" class="refresh-icon">🔄</div>
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
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  // 原有参数
  avatar: { type: String, default: '' },
  userName: { type: String, required: true },
  userId: { type: [String, Number], required: true },
  userRegion: { type: String, default: '-' },
  // 新增：是否启用随机动物头像
  randomAnimal: { type: Boolean, default: false },
  // 动物类型（可选：dog/cat），默认 dog
  animalType: { type: String, default: 'dog' }
})

const emit = defineEmits(['action'])

const avatarError = ref(false)
// 当前实际显示的头像 URL（可能是传入的 avatar，也可能是随机动物）
const currentAvatar = ref(props.avatar || '')

// 如果外部 avatar 变化，同步更新（但随机模式下忽略外部变化）
watch(() => props.avatar, (newVal) => {
  if (!props.randomAnimal) {
    currentAvatar.value = newVal || ''
    avatarError.value = false
  }
})

const handleAvatarError = () => {
  avatarError.value = true
}

const handleButtonClick = () => {
  emit('action', { userId: props.userId, userName: props.userName })
}

// ---------- 随机动物图片逻辑 ----------
const fetchRandomAnimal = async () => {
  avatarError.value = false // 重置错误状态
  try {
    let url = ''
    if (props.animalType === 'dog') {
      const res = await fetch('https://dog.ceo/api/breeds/image/random')
      const data = await res.json()
      if (data.status === 'success') {
        url = data.message
      } else {
        throw new Error('API 返回失败')
      }
    } else if (props.animalType === 'cat') {
      // 使用 The Cat API (无需 api key)
      const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=1')
      const data = await res.json()
      if (data.length > 0) {
        url = data[0].url
      } else {
        throw new Error('API 返回空')
      }
    } else {
      // 兜底：用 LoremFlickr
      const seed = Date.now() + Math.random()
      url = `https://loremflickr.com/200/200/${props.animalType}?random=${seed}`
      // LoremFlickr 重定向后是图片，但会有缓存问题，加上时间戳
    }
    if (url) {
      currentAvatar.value = url
    }
  } catch (err) {
    console.error('获取动物图片失败', err)
    avatarError.value = true // 显示默认图
  }
}

const refreshIfRandom = () => {
  if (props.randomAnimal) {
    fetchRandomAnimal()
  }
}

// 如果启用了随机模式，且没有传入有效头像，则自动加载一张
onMounted(() => {
  if (props.randomAnimal && !currentAvatar.value) {
    fetchRandomAnimal()
  }
})
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
  }

  .default-avatar {
    width: 100%;
    height: 100%;
    background-color: #d6d6d6;
  }

  .refresh-icon {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .refresh-icon {
    opacity: 1;
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
  .user-id, .user-region {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }
}

.action-button {
  text-align: center;
}
</style>