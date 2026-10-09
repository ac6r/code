
<template>
  <div class="chat-session-list">
    <div class="part-title">快速会话</div>
    <div class="part-list">
      <div
        v-for="item in dynamicUsers"
        :key="item.contactId"
        class="part-item"
        @click="handleClick(item)"
      >
        <div class="contact-avatar">
          <Avatar
            :userId="item.contactId"
            :userName="item.nickName"
            :avatar="item.avatar"
            :randomAnimal="false"
         
          />
        </div>
        <div class="text">{{ item.nickName }}</div>
      </div>

      <div
        v-for="item in dynamicGroups"
        :key="item.contactId"
        class="part-item"
        @click="handleClick(item)"
      >
        <div class="contact-avatar">
          <Avatar
            :userId="item.contactId"
            :userName="item.nickName"
            :randomAnimal="false"
            :avatar="item.avatar"
          />
        </div>
        <div class="text">{{ item.nickName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'                       
import Avatar from '../../components/Avatar.vue'
import { useContacts } from '../../stores/contacts.js'  

const emit = defineEmits(['select'])
const { contacts } = useContacts()

// 用户列表
const dynamicUsers = computed(() =>
  Object.entries(contacts)
    .filter(([, info]) => info.contactType === 'USER')
    .map(([id, info]) => ({
      contactId: id,
      nickName: info.nickName,
      contactType: 'USER',
      avatar:info.avatar
    }))
)

// 群聊列表
const dynamicGroups = computed(() =>
  Object.entries(contacts)
    .filter(([, info]) => info.contactType === 'GROUP')
    .map(([id, info]) => ({
      contactId: id,
      nickName: info.nickName,
      contactType: 'GROUP',
      avatar:info.avatar
    }))
)

const handleClick = (item) => {
  emit('select', item)
}
</script>

<style lang="scss" scoped>

</style>

<style lang="scss" scoped>
.chat-session-list {
  height: calc(100vh - 62px);
  overflow: hidden;
  border-top: 1px solid #ddd;

  &:hover {
    overflow: auto;
  }

  .part-title {
    color: #515151;
    padding-left: 10px;
    margin-top: 10px;
    font-size: 14px;
    font-weight: 500;
  }

  .part-list {
    .part-item {
      display: flex;
      align-items: center;
      padding: 10px 10px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #d6d6d7;
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
  }
}

/* 头像容器：固定35x35，隐藏文字和按钮 */
.contact-avatar {
  width: 35px;
  height: 35px;
  overflow: hidden;
  border-radius: 4px;
  flex-shrink: 0;

  :deep(.avatar-card) { padding: 0; }
  :deep(.avatar-wrapper) { margin-bottom: 0; gap: 0; }
  :deep(.user-info) { display: none; }
  :deep(.action-button) { display: none; }
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
</style>