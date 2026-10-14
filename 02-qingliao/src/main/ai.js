import { ipcMain } from 'electron'
import axios from 'axios'

// 一次请求携带的最大历史条数，避免上下文过长
const MAX_HISTORY = 20

// 快速会话四个对象各自的人设，让模型以对应身份回复
const PERSONAS = {
  u_fixed1:
    '你是"小明"，一名在校男生，性格热心、有耐心。说话口语化、简短，喜欢帮同学解答学习上的问题。',
  u_fixed2:
    '你是"小红"，一名在校女生，性格开朗活泼，语气亲切自然，偶尔带一点轻松的语气词。',
  g_fixed1:
    '你是"前端技术交流群"里的一名活跃成员，经常参与 Vue、React、工程化、性能优化等前端话题的讨论，回答专业但简短，像微信群聊里那样直接接话。',
  g_fixed2:
    '你是"摸鱼闲聊群"里的一名成员，喜欢聊吃饭、追剧、摸鱼等日常话题，语气轻松随意，经常接梗。'
}

function buildSystemPrompt({ contactId, nickName, contactType }) {
  const persona = PERSONAS[contactId] || `你是"${nickName}"，一个友善、乐于聊天的对象。`
  const scene = contactType === 'GROUP' ? '群聊' : '一对一私聊'
  return [
    persona,
    `现在你和用户正在进行${scene}。`,
    '请认真理解用户的问题并直接回答，正常聊天即可；不要答非所问。',
    '只输出回复内容本身：不要加"小明："这类前缀，也不要提及自己是 AI 或程序。',
    '回复尽量简短、自然、口语化。'
  ].join('\n')
}

// 把渲染层传来的消息转换成 OpenAI 兼容格式：self -> user，其余 -> assistant
function toChatMessages(system, list) {
  const history = (Array.isArray(list) ? list : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.self ? 'user' : 'assistant', content: m.text }))

  // 首条必须是 user，去掉开头的 assistant 消息
  const firstUser = history.findIndex((m) => m.role === 'user')
  const normalized = firstUser > 0 ? history.slice(firstUser) : history

  return [{ role: 'system', content: system }, ...normalized]
}

// 支持的 AI 提供商（都是 OpenAI 兼容的 /chat/completions 接口）
// 优先级：显式 AI_PROVIDER > 第一个配置了密钥的提供商
function getProviders() {
  return [
    {
      name: 'deepseek',
      label: 'DeepSeek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    },
    {
      name: 'doubao',
      label: '豆包',
      apiKey: process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY,
      baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
      // 豆包既可用模型名，也可用推理接入点 id（ep-xxxxxxxx）
      model: process.env.ARK_MODEL || process.env.DOUBAO_MODEL || 'doubao-pro-32k'
    }
  ]
}

function resolveProvider() {
  const providers = getProviders()
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase()
  if (explicit) {
    const hit = providers.find((p) => p.name === explicit)
    if (hit && hit.apiKey) return hit
  }
  return providers.find((p) => p.apiKey) || null
}

export function registerAiHandlers() {
  // 防止重复注册（重复调用 ipcMain.handle 会抛错）
  if (registerAiHandlers.done) return
  registerAiHandlers.done = true
  ipcMain.handle('chat:ai', async (_event, payload = {}) => {
    const { contactId, nickName, contactType, messages } = payload
    const provider = resolveProvider()

    if (!provider) {
      return {
        ok: false,
        error: 'NO_PROVIDER',
        message: '未配置 AI 密钥：请在项目根目录 .env 里设置 DEEPSEEK_API_KEY 或 ARK_API_KEY'
      }
    }

    const url = provider.baseURL.replace(/\/+$/, '') + '/chat/completions'
    try {
      const { data } = await axios.post(
        url,
        {
          model: provider.model,
          messages: toChatMessages(buildSystemPrompt({ contactId, nickName, contactType }), messages),
          stream: false
        },
        {
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )
      const reply = data?.choices?.[0]?.message?.content?.trim()
      if (!reply) {
        return {
          ok: false,
          error: 'EMPTY_REPLY',
          provider: provider.label,
          message: `${provider.label} 没有返回内容`
        }
      }
      return { ok: true, reply, provider: provider.label }
    } catch (err) {
      const detail =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        '请求失败'
      return {
        ok: false,
        error: 'REQUEST_FAILED',
        provider: provider.label,
        status: err?.response?.status,
        message: `${provider.label} 请求失败：${detail}`
      }
    }
  })
}
