<template>
  <div class="give-message">
    <div class="chat-header">
      <h3>与 {{ contactName }} 聊天</h3>
      <span class="chat-id">ID: {{ contactId }}</span>
    </div>

    <!-- 消息展示区域 -->
    <div class="message-panel" ref="messagePanel">
      <div v-if="processedMessages.length === 0" class="message-item empty">
        暂无消息，开始聊天吧
      </div>
      <div
        v-for="(msg, index) in processedMessages"
        :key="index"
        class="message-item"
        :class="{ self: msg.self }"
      >
        <div class="message-bubble">{{ msg.text }}</div>
        <div class="message-time">{{ msg.time }}</div>
      </div>
    </div>

    <!-- 发送输入框 -->
    <div class="send-panel">
      <el-input
        type="textarea"
        :rows="3"
        v-model="messageText"
        placeholder="请输入消息..."
        @keyup.enter.exact="sendMessage"
      />
      <el-button type="primary" @click="sendMessage">发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useChatMessages } from '../../stores/chatMessages'
import { useContacts } from '../../stores/contacts'
import { useUserInfoStore } from '../../stores/UserinfoStore'

const route = useRoute()
const contactId = computed(() => route.params.contactId)

const { getMessages, addMessage } = useChatMessages()
const { getContact } = useContacts()
const userInfoStore = useUserInfoStore()

// 通过 store 动态获取联系人昵称（同时支持固定和新增联系人）
const contactName = computed(() => getContact(contactId.value).nickName)

const messageText = ref('')
const messages = ref([])
const messagePanel = ref(null)

// 动态计算 self：根据当前登录用户的 userId 和消息的 senderId 对比
const processedMessages = computed(() =>
  messages.value.map(msg => ({
    ...msg,
    self: msg.senderId ? msg.senderId === userInfoStore.currentUserId : msg.self
  }))
)

// 切换联系人时加载对应消息历史
watch(contactId, (newId) => {
  if (!newId) return
  messages.value = getMessages(newId)
  messageText.value = ''
  nextTick(() => {
    if (messagePanel.value) {
      messagePanel.value.scrollTop = messagePanel.value.scrollHeight
    }
  })
}, { immediate: true })

// 发送消息
const sendMessage = () => {
  if (!messageText.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const msg = {
    text: messageText.value,
    time: timeStr,
    self: true,
    senderId: userInfoStore.currentUserId
  }
  addMessage(contactId.value, msg)
  messageText.value = ''

  nextTick(() => {
    if (messagePanel.value) {
      messagePanel.value.scrollTop = messagePanel.value.scrollHeight
    }
  })
}
</script>

<style lang="scss" scoped>
.give-message {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
  background: #fff;

  h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }

  .chat-id {
    font-size: 12px;
    color: #999;
  }
}

/* 消息面板 */
.message-panel {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .message-item {
    display: flex;
    flex-direction: column;
    max-width: 60%;

    &.self {
      align-self: flex-end;  /* 自己的消息靠右 */
      .message-bubble {
        background: #95ec69;
      }
      .message-time {
        text-align: right;
      }
    }

    .message-bubble {
      background: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .message-time {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .empty {
    text-align: center;
    color: #999;
    margin-top: 40px;
    align-self: center;
    max-width: none !important;
  }
}

/* 发送面板 */
.send-panel {
  padding: 15px 20px;
  background: #fff;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;

  .el-textarea {
    flex: 1;
  }

  .el-button {
    height: 67px;
  }
}
</style>