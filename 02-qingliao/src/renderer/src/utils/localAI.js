// 内置兜底 AI：不依赖网络与密钥，按四个快速会话对象的“人设”生成回复。
// 只有在 DeepSeek 调用失败、未配置密钥或主进程 handler 不存在时才使用，保证一定聊得起来。

const INTENTS = [
  { key: 'greeting', test: /(你好|您好|哈喽|嗨|在吗|在么|hi|hello)/i },
  { key: 'thanks', test: /(谢谢|多谢|感谢|辛苦了|thx|thanks)/i },
  { key: 'farewell', test: /(再见|拜拜|晚安|先走|回头聊|回聊|bye)/i },
  { key: 'food', test: /(吃|饭|饿|外卖|火锅|日料|奶茶|咖啡|喝|零食|烧烤)/ },
  { key: 'frontend', test: /(vue|react|前端|组件|vite|webpack|css|scss|less|js|javascript|ts|typescript|性能|打包|状态管理|pinia|router|接口|报错|bug)/i },
  { key: 'study', test: /(题|作业|考试|公式|数学|英语|复习|不会|怎么算|知识点)/ },
  { key: 'question', test: /[?？]|(吗|呢|怎么|为什么|如何|能不能|可不可以|是不是|好不好)/ }
]

const REPLIES = {
  // 小明：热心、耐心的同学
  u_fixed1: {
    greeting: ['在呢，怎么啦？', '嗨，我在，有啥事？'],
    thanks: ['客气啥，能帮上就好', '不客气，随时问我'],
    farewell: ['行，那回头聊', '好嘞，拜拜'],
    food: ['说到吃的我就来劲了，你想吃啥？', '要不整点简单的？'],
    frontend: ['这个我得看看具体场景，你卡在哪一步了？', '先把报错贴出来，我帮你一起看'],
    study: ['这题先看清考点，再一步步来', '别急，把已知条件列出来就好办了'],
    question: ['嗯……你先说说你的思路？', '我想想啊，感觉可以先试试最简单的办法'],
    generic: ['嗯嗯，我在听', '有道理，然后呢？', '这个我还真没想过，哈哈']
  },
  // 小红：开朗活泼
  u_fixed2: {
    greeting: ['嗨呀，我在的～', '在在在，怎么啦'],
    thanks: ['不客气啦～', '嘿嘿，小事一桩'],
    farewell: ['那下次聊哦，拜拜～', '晚安啦，做个好梦'],
    food: ['我想喝奶茶！不过还是先忍忍吧', '走走走，吃点好的'],
    frontend: ['这个我也在学，一起研究呀', '听起来有点难，不过你可以的！'],
    study: ['慢慢来嘛，别着急', '加油，我相信你能搞定的'],
    question: ['嗯……让我想想哦', '感觉可以试试看？'],
    generic: ['哈哈哈，你好有意思', '真的假的呀？', '嗯哼，然后呢', '可以可以～']
  },
  // 前端技术交流群
  g_fixed1: {
    greeting: ['来了来了', '在的，啥事'],
    thanks: ['客气了', '小事'],
    farewell: ['撤了，回聊', '先忙去了，拜'],
    food: ['又要到饭点了', '群主请客吗（狗头）'],
    frontend: ['+1，我们项目里也踩过这个坑', '这个场景建议先翻官方文档', '同意，实践下来确实是这样'],
    study: ['这个属于基础知识点了', '先补一下前置知识会顺很多'],
    question: ['有没有具体点的场景？', '描述再详细点，好判断'],
    generic: ['+1', '附议', '哈哈哈真实', '同感']
  },
  // 摸鱼闲聊群
  g_fixed2: {
    greeting: ['冒个泡', '在的在的'],
    thanks: ['客气啥', '别客气'],
    farewell: ['溜了溜了', '下班！'],
    food: ['今天中午吃啥？在线等', '公司楼下那家还不错'],
    frontend: ['你们又在卷技术了', '听不懂，但大受震撼'],
    study: ['摸鱼中，勿扰（不是）', '这题我会，但我先不说'],
    question: ['你猜', '这题超纲了'],
    generic: ['哈哈哈', '笑死', '摸鱼快乐', '走，一起', '真实']
  }
}

const ECHO_TEMPLATES = [
  '「{t}」？展开说说',
  '你说「{t}」，我有点好奇',
  '关于「{t}」，你是怎么想的？'
]

// 需要“真正作答”的意图：离线时如实说明，避免套模板答非所问
const OFFLINE = {
  u_fixed1: [
    '（离线简易回复）这题我答不准，你先在项目根目录 .env 里配一下 AI 密钥，我就能好好讲了',
    '（离线简易回复）我这边现在只能瞎聊，配好 AI 密钥再问我这个吧'
  ],
  u_fixed2: [
    '（离线简易回复）这个我答不好啦，配好 AI 密钥我就能正常聊天了～',
    '（离线简易回复）等我连上模型再好好回答你呀'
  ],
  g_fixed1: [
    '（离线简易回复）配一下 .env 里的 AI 密钥，我才能在这正经讨论技术问题',
    '（离线简易回复）+1，不过这问题得让真模型来答'
  ],
  g_fixed2: [
    '（离线简易回复）没配密钥，我只能陪你瞎聊，配一下呗',
    '（离线简易回复）这题超纲了，配上密钥再问我'
  ]
}

const REAL_QA_INTENTS = new Set(['question', 'frontend', 'study'])

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export function generateReply({ contactId, text = '' } = {}) {
  const table = REPLIES[contactId] || REPLIES.u_fixed1
  const content = String(text || '').trim()
  const intent = INTENTS.find((item) => item.test.test(content))

  // 需要真正作答的问题：离线时不再套模板，如实说明
  if (intent && REAL_QA_INTENTS.has(intent.key)) {
    return pick(OFFLINE[contactId] || OFFLINE.u_fixed1)
  }
  if (intent && table[intent.key]) {
    return pick(table[intent.key])
  }
  // 没匹配到意图时，偶尔引用对方的话，更像在聊天
  if (content && content.length <= 16 && Math.random() < 0.45) {
    return pick(ECHO_TEMPLATES).replace('{t}', content)
  }
  return pick(table.generic)
}

export default { generateReply }
