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
      <!-- DeepSeek 正在回复 -->
      <div v-if="replying" class="message-item typing">
        <div class="message-bubble">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- 发送输入框 -->
    <div class="send-panel">
      <el-input
        ref="inputRef"
        type="textarea"
        :rows="3"
        v-model="messageText"
        placeholder="请输入消息..."
        @keyup.enter.exact="sendMessage"
      />
      <el-button type="primary" :loading="replying" @click="sendMessage">发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useChatMessages } from '../../stores/chatMessages'
import { useContacts } from '../../stores/contacts'
import localAI from '../../utils/localAI'

const route = useRoute()
const contactId = computed(() => route.params.contactId)

const { getMessages, addMessage } = useChatMessages()
const { getContact } = useContacts()

// 通过 store 动态获取联系人信息（同时支持固定和新增联系人）
const contact = computed(() => getContact(contactId.value))
const contactName = computed(() => contact.value.nickName)

const messageText = ref('')
const messages = ref([])
const messagePanel = ref(null)
const inputRef = ref(null)
// 是否正在等待 DeepSeek 回复
const replying = ref(false)

// 消息左右归属：直接采用消息自带的 self（true 在右=自己，false 在左=对方/AI）。
// 之前用 senderId 反推，会因演示账号 userId 与联系人 contactId 相同（如都用 u_fixed1）
// 而把对方的回复误判成自己发的，导致两侧消息挤在同一边。
const processedMessages = computed(() =>
  messages.value.map(msg => ({ ...msg, self: !!msg.self }))
)

// 判断某条消息是否为当前用户发出
const isSelf = (msg) => !!msg.self

// 取当前时刻，发送与回复都以同一套时钟打时间戳
const nowStamp = () => {
  const d = new Date()
  return {
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    timestamp: d.getTime()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagePanel.value) {
      messagePanel.value.scrollTop = messagePanel.value.scrollHeight
    }
  })
}

// 发送后/回复后自动把光标放回输入框，不用每次再点一下
const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

// 切换联系人时加载对应消息历史
watch(contactId, (newId) => {
  if (!newId) return
  messages.value = getMessages(newId)
  messageText.value = ''
  scrollToBottom()
  focusInput()
}, { immediate: true })

onMounted(() => {
  focusInput()
})

// 是否已提示过“已切换内置 AI”
let fallbackNotified = false

// 优先走主进程的真实模型（DeepSeek / 豆包）：没配置密钥 / 调用失败 / 没有 handler 都返回空串，交由兜底处理
const askAI = async () => {
  if (!window.ipcRenderer || typeof window.ipcRenderer.invoke !== 'function') return ''
  try {
    const history = messages.value.map((m) => ({ self: isSelf(m), text: m.text }))
    const result = await window.ipcRenderer.invoke('chat:ai', {
      contactId: contactId.value,
      nickName: contactName.value,
      contactType: contact.value.contactType,
      messages: history
    })
    return result && result.ok ? result.reply : ''
  } catch (err) {
    return ''
  }
}

// 发送消息：先落自己的消息（带发送时间），再请求 AI，回复同样带时间
const sendMessage = async () => {
  if (replying.value) return
  const text = messageText.value.trim()
  if (!text) {
    ElMessage.warning('请输入内容')
    return
  }

  addMessage(contactId.value, {
    text,
    ...nowStamp(),
    self: true
  })
  messageText.value = ''
  scrollToBottom()
  focusInput()

  replying.value = true
  try {
    let reply = await askAI()
    if (!reply) {
      // 没配密钥或调用失败：退回内置离线回复，保证四个对象一定有回复
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 600))
      reply = localAI.generateReply({
        contactId: contactId.value,
        contactType: contact.value.contactType,
        nickName: contactName.value,
        text
      })
      if (!fallbackNotified && window.ipcRenderer) {
        fallbackNotified = true
        ElMessage.info('未配置 / 无法连接 AI，当前为内置离线回复（配置密钥后自动切换）')
      }
    }
    addMessage(contactId.value, {
      text: reply,
      ...nowStamp(),
      self: false
    })
    scrollToBottom()
  } finally {
    replying.value = false
    focusInput()
  }
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

    /* DeepSeek 正在回复 */
    &.typing .message-bubble {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 13px 14px;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #bbb;
        display: inline-block;
        animation: typing-blink 1.2s infinite ease-in-out;
      }
      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
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

@keyframes typing-blink {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
