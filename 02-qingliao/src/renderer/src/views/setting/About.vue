<template>
  <div class="about-page">
    <div class="about-inner">
      <!-- 顶部：Logo + 名称 + 版本 -->
      <div class="about-hero">
        <div class="app-logo">轻</div>
        <div class="app-name">{{ info.name }}</div>
        <div class="app-version">版本 {{ versionText }}</div>
      </div>

      <!-- 功能列表 -->
      <div class="about-list">
        <div class="about-item" @click="checkUpdate">
          <span class="item-label">检查更新</span>
          <span class="item-value">
            <span v-if="checking" class="checking">检测中…</span>
            <span v-else>{{ versionText }}</span>
            <span class="iconfont icon-right arrow"></span>
          </span>
        </div>

        <div v-for="row in infoRows" :key="row.key" class="about-item" @click="openText(row)">
          <span class="item-label">{{ row.label }}</span>
          <span class="item-value">
            <span class="iconfont icon-right arrow"></span>
          </span>
        </div>

        <div class="about-item" @click="feedbackVisible = true">
          <span class="item-label">意见反馈</span>
          <span class="item-value">
            <span class="iconfont icon-right arrow"></span>
          </span>
        </div>
      </div>

      <!-- 底部：版权 + 运行环境 -->
      <div class="about-footer">
        <div>Electron {{ info.electron || '-' }} · Chromium {{ info.chrome || '-' }} · Node {{ info.node || '-' }}</div>
        <div>© {{ year }} 轻聊　保留所有权利</div>
      </div>
    </div>

    <!-- 文本内容弹窗（隐私 / 协议 / 开源许可） -->
    <el-dialog v-model="textVisible" :title="textDialog.title" width="520px">
      <div class="text-content" v-html="textDialog.html"></div>
    </el-dialog>

    <!-- 意见反馈 -->
    <el-dialog v-model="feedbackVisible" title="意见反馈" width="460px">
      <el-input
        v-model="feedback"
        type="textarea"
        :rows="5"
        maxlength="200"
        show-word-limit
        resize="none"
        placeholder="说说你遇到的问题或建议…"
      />
      <template #footer>
        <el-button @click="feedbackVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const info = ref({ name: '轻聊', version: '', electron: '', chrome: '', node: '' })
const year = new Date().getFullYear()

const checking = ref(false)
const textVisible = ref(false)
const feedbackVisible = ref(false)
const feedback = ref('')

const textDialog = reactive({ title: '', html: '' })

const infoRows = [
  { key: 'privacy', label: '隐私保护指引' },
  { key: 'terms', label: '用户服务协议' },
  { key: 'license', label: '开源许可' }
]

const versionText = computed(() => (info.value.version ? 'v' + info.value.version : '-'))

const TEXTS = {
  privacy: {
    title: '隐私保护指引',
    html: `
      <p>轻聊是一款本地演示应用，我们非常重视你的隐私。</p>
      <p><b>1. 收集范围</b><br />仅在本地保存登录账号、昵称、头像与聊天记录，用于展示会话功能。</p>
      <p><b>2. 文件管理</b><br />文件管理中的内容存放在应用自己的数据目录，不会自动上传到任何服务器。</p>
      <p><b>3. AI 会话</b><br />当你与"快速会话"中的对象聊天时，消息会发送给所配置的 AI 服务（DeepSeek / 豆包）以获得回复；未配置密钥时对话仅在本地生成。</p>
      <p><b>4. 你的权利</b><br />你可以随时在设置中清空数据，或直接删除应用的数据目录。</p>
    `
  },
  terms: {
    title: '用户服务协议',
    html: `
      <p>欢迎使用轻聊。使用本应用即表示你同意以下约定：</p>
      <p><b>1. 用途</b><br />本应用用于学习与技术演示，请勿用于任何违法用途。</p>
      <p><b>2. 账号</b><br />演示账号仅用于本地体验，数据保存在你自己的设备上。</p>
      <p><b>3. 内容</b><br />你对发送的内容负责，请勿发布违法、侵权或不良信息。</p>
      <p><b>4. 免责</b><br />本应用按"现状"提供，不对因使用产生的任何损失承担责任。</p>
    `
  },
  license: {
    title: '开源许可',
    html: `
      <p>轻聊基于以下优秀的开源项目构建，在此致谢：</p>
      <ul>
        <li>Electron — MIT License</li>
        <li>Vue 3 / Vue Router / Pinia — MIT License</li>
        <li>Element Plus — MIT License</li>
        <li>Vite / electron-vite — MIT License</li>
        <li>axios — MIT License</li>
      </ul>
      <p class="muted">各项目版权归其作者所有。</p>
    `
  }
}

const hasIpc = () => window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function'

async function loadInfo() {
  if (!hasIpc()) return
  try {
    const result = await window.ipcRenderer.invoke('app:info')
    if (result) info.value = { ...info.value, ...result }
  } catch (err) {
    // 主进程未就绪时静默降级，页面仍可正常展示
  }
}

async function checkUpdate() {
  if (checking.value) return
  checking.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  checking.value = false
  ElMessage.success(`当前已是最新版本 ${versionText.value}`)
}

function openText(row) {
  const text = TEXTS[row.key]
  if (!text) return
  textDialog.title = text.title
  textDialog.html = text.html
  textVisible.value = true
}

function submitFeedback() {
  const content = feedback.value.trim()
  if (!content) {
    ElMessage.warning('请输入反馈内容')
    return
  }
  feedbackVisible.value = false
  feedback.value = ''
  ElMessage.success('反馈已提交，感谢你的建议')
}

onMounted(loadInfo)
</script>

<style lang="scss" scoped>
.about-page {
  height: calc(100vh - 62px);
  overflow: auto;
  padding: 32px 20px 40px;
  box-sizing: border-box;
  background: #f5f5f5;
}

.about-inner {
  width: 420px;
  max-width: 100%;
  margin: 0 auto;
}

.about-hero {
  text-align: center;
  padding-bottom: 26px;

  .app-logo {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    border-radius: 14px;
    background: #07c160;
    color: #fff;
    font-size: 30px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .app-name {
    margin-top: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #1f2329;
  }

  .app-version {
    margin-top: 6px;
    font-size: 13px;
    color: #999;
  }
}

.about-list {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;

  .about-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f2f2f2;
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f7f7f7;
    }

    .item-label {
      font-size: 14px;
      color: #1f2329;
    }

    .item-value {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #999;

      .checking {
        color: #07c160;
      }

      .arrow {
        font-size: 12px;
        color: #c8c8c8;
      }
    }
  }
}

.about-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #b0b0b0;
  line-height: 2;
}

.text-content {
  font-size: 13px;
  line-height: 1.9;
  color: #4b4b4b;
  max-height: 52vh;
  overflow: auto;

  :deep(p) {
    margin: 0 0 10px;
  }

  :deep(ul) {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  :deep(.muted) {
    color: #999;
  }
}
</style>
