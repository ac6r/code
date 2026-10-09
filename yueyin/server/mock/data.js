// 本地 mock 数据源。
// 真实 NeteaseCloudMusicApi 不可用时，网关用这里的数据兜底，保证页面永远有内容。
// 所有数据都是确定性生成的（固定种子），每次启动结果一致。

const NCM_BASE = 'https://music.163.com/song/media/outer/url'

// ---------------------------------------------------------------- 工具

// 线性同余伪随机，固定种子 => 每次启动数据一致
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const rng = makeRng(20240918)
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const int = (min, max) => min + Math.floor(rng() * (max - min + 1))

// ---------------------------------------------------------------- 素材库

const SINGER_NAMES = [
  '林深见鹿', '陈默', '苏晚棠', '南山旧梦', '周与谁', '沈青禾', '顾轻舟', '白鹭洲',
  '江照月', '温言', '许星河', '叶知秋', '程屿', '秦昭', '余声', '洛清河',
  '夜航船', '裴照', '云间雀', '谢知微', '宋辞', '梅子黄时', '陆离', '花间令',
  '穆青', '半城烟沙', '柳三变', '燕归梁', '陈拾', '空山新雨', '于归', '听风吟',
  '陌上尘', '临江仙', '程蝶衣', '青山见我',
]

const ALBUM_NAMES = [
  '夜航', '浮生记', '凡人歌', '城南旧事', '山海', '春江花月', '长夜漫谈', '无名之辈',
  '白昼梦', '谷雨', '候鸟', '群青', '折子戏', '与你', '日落大道', '慢慢',
  '雾中风景', '归途', '旧信封', '晚风信箱', '青铜时代', '南方以南', '旷野', '不息',
]

const SONG_NAMES = [
  '夜航船', '浮生若梦', '城南旧事', '山海不可平', '春江花月夜', '长夜漫漫', '无名之辈',
  '白昼梦游', '谷雨', '候鸟南飞', '群青', '折子戏', '日落大道', '慢慢喜欢你', '雾中风景',
  '归途列车', '旧信封', '晚风信箱', '青铜时代', '南方以南', '旷野呼喊', '生生不息',
  '月半小夜曲', '风继续吹', '光辉岁月', '海阔天空', '遥远的她', '喜欢你', '一生所爱',
  '倩女幽魂', '沧海一声笑', '男儿当自强', '铁血丹心', '世间始终你好', '只愿一生爱一人',
  '当我们同在一起', '小镇姑娘', '旅行的意义', '鱼', '还是会寂寞', '九份的咖啡店',
  '玫瑰色的你', '流浪者之歌', '下雨的夜晚', '我想你要走了', '你在烦恼什么', '十年一刻',
  '夜空中最亮的星', '追梦赤子心', '再见杰克', '公路之歌', '南方', '无法逃脱',
  '春风十里', '成都', '理想', '一如年少模样', '理想三旬', '途中',
]

const PLAYLIST_NAMES = [
  '深夜电台 | 一个人的安静时刻', '华语流行精选集', '通勤路上单曲循环', '民谣里的城市与远方',
  '那些年我们单曲循环的歌', '轻音乐 | 专注工作背景音', '摇滚不死 | 华语摇滚精选',
  '粤语金曲回忆杀', '治愈系 | 温柔的午后', '运动健身燃脂BGM', '独立音乐人推荐',
  '经典老歌 | 时光倒流二十年', '睡前放松 | 助眠轻音乐', '心情低落时听这些',
  '古风 | 一梦江湖', '电子 | 深夜蹦迪指南',
]

const MV_NAMES = [
  '夜航船 (官方版MV)', '浮生若梦 (Live)', '城南旧事 (官方MV)', '山海不可平 (剧情版)',
  '春江花月夜 (官方版)', '长夜漫漫 (字幕版)', '无名之辈 (电影主题曲)', '白昼梦游 (官方版)',
  '谷雨 (现场版)', '候鸟南飞 (官方MV)', '群青 (歌词版)', '折子戏 (官方版)',
  '日落大道 (官方MV)', '慢慢喜欢你 (官方版)', '雾中风景 (概念版)', '归途列车 (官方MV)',
  '旧信封 (动画版)', '晚风信箱 (官方版)', '青铜时代 (官方MV)', '南方以南 (现场)',
  '旷野呼喊 (官方版)', '生生不息 (官方MV)', '月半小夜曲 (经典版)', '风继续吹 (演唱会)',
  '光辉岁月 (官方MV)', '海阔天空 (现场)', '遥远的她 (官方版)', '喜欢你 (官方MV)',
  '一生所爱 (电影版)', '倩女幽魂 (官方MV)',
]

const DJ_NAMES = [
  '深夜电台 · 睡前故事', '音乐早餐 | 每天一首好歌', '独立音乐观察', '城市夜行者',
  '老歌放映厅', '民谣小酒馆', '古典音乐入门', '电子音乐周报',
  '电影原声精选', '摇滚现场实录', '音乐人访谈录', '午后爵士咖啡馆',
]

const NICKNAMES = [
  '听风的人', '路人甲', '南方有雨', '一只柠檬', '夜行动物', '小镇做题家', '早八人',
  '不吃香菜', '很困的猫', '海边的卡夫卡', '沉默的大多数', '打工人小张', '爱睡觉的鱼',
  '橘子汽水', '想退休的咸鱼', '周末不出门',
]

const COMMENT_TEXTS = [
  '第一次听就单曲循环了，副歌太抓耳了。',
  '前奏一响，眼泪就下来了。',
  '这首歌陪我度过了最难的那段日子。',
  '2026年了还有人在听吗？',
  '词写得太好了，每一句都像在说我自己。',
  '循环了一整天，还是没听腻。',
  '安利给所有人，真的好听。',
  '耳机里放着这首歌，走在路上感觉世界都安静了。',
  '这个编曲绝了，层次感特别强。',
  '听到第 37 秒那段间奏直接起鸡皮疙瘩。',
  '高中时候的歌，现在听还是很有感觉。',
  '希望多年以后还能记得第一次听它的心情。',
  '这歌适合深夜一个人听。',
  '歌手的声音辨识度好高。',
  '每次难过的时候都会来听。',
  '评论区比歌还好看系列。',
]

const PLAY_TAGS = ['华语', '流行', '民谣', '摇滚', '电子', '轻音乐', '粤语', '古风', '爵士', '治愈', '运动', '怀旧']

// ---------------------------------------------------------------- 生成器

const now = Date.now()
const DAY = 86400000

function makeSinger(i) {
  return {
    id: 3000 + i,
    name: SINGER_NAMES[i % SINGER_NAMES.length],
    picUrl: `/api/mock-img/artist/${3000 + i}.svg`,
    alias: [],
    albumSize: int(3, 40),
    musicSize: int(20, 300),
    mvSize: int(0, 30),
    fansCount: int(1000, 900000),
    followed: false,
    briefDesc: `${SINGER_NAMES[i % SINGER_NAMES.length]}，华语流行音乐人。擅长将生活里的细碎片段写进旋律，作品风格多变，代表作广受好评。`,
  }
}

const singers = Array.from({ length: 36 }, (_, i) => makeSinger(i))

function makeAlbum(i) {
  const artist = singers[i % singers.length]
  return {
    id: 4000 + i,
    name: ALBUM_NAMES[i % ALBUM_NAMES.length],
    picUrl: `/api/mock-img/album/${4000 + i}.svg`,
    type: pick(['专辑', 'EP', 'Single']),
    company: pick(['独立发行', '海蝶音乐', '摩登天空', '环球唱片', '相信音乐']),
    publishTime: now - int(30, 2000) * DAY,
    size: int(8, 14),
    artist,
    artists: [artist],
    description: `《${ALBUM_NAMES[i % ALBUM_NAMES.length]}》是${artist.name}的全新作品，共收录 ${int(8, 14)} 首歌曲。整张专辑围绕时间与记忆展开，在编曲上做了更多尝试。`,
  }
}

const albums = Array.from({ length: 24 }, (_, i) => makeAlbum(i))

function makeSong(i, { fee = 0, cp = 1 } = {}) {
  const album = albums[i % albums.length]
  const singer = album.artists[0]
  const id = 1000 + i
  return {
    id,
    name: SONG_NAMES[i % SONG_NAMES.length],
    mv: i % 3 === 0 ? 5000 + (i % 30) : 0,
    ar: [singer],
    al: { id: album.id, name: album.name, picUrl: album.picUrl },
    alia: i % 4 === 0 ? ['（电影《山海》主题曲）'] : [],
    fee,
    dt: int(150, 320) * 1000,
    publishTime: album.publishTime,
    // mock 歌曲没有网易云版权音源，直接指定本地音频（public/1.mp3、2.mp3）。
    // src/utils/song.js 的 formatSongInfo 会优先用这个 url，真实 API 的响应
    // 里没有该字段，因此不影响真实数据。
    url: i % 2 === 0 ? '/1.mp3' : '/2.mp3',
    _cp: cp,
  }
}

const songs = Array.from({ length: 60 }, (_, i) =>
  makeSong(i, { fee: i % 11 === 0 ? 1 : 0, cp: i % 11 === 0 || i % 17 === 0 ? 0 : 1 })
)

const songById = new Map(songs.map((s) => [s.id, s]))

// 前端 formatSongs(list, privileges) 按下标读 privileges[index].cp，
// privileges 长度必须 >= 歌曲数，否则 TypeError。
function privilegesFor(list) {
  return list.map((s) => ({ id: s.id, cp: s._cp ?? 1, fee: s.fee ?? 0, st: 0, pl: 0, dl: 0 }))
}

function makePlaylist(i) {
  const creator = {
    userId: 9000 + (i % 8),
    nickname: NICKNAMES[i % NICKNAMES.length],
    avatarUrl: `/api/mock-img/user/${9000 + (i % 8)}.svg`,
  }
  // 每个歌单从歌曲池里取一段连续歌曲，保证 trackIds / tracks / privileges 对齐
  const start = (i * 7) % songs.length
  const size = int(12, 28)
  const tracks = Array.from({ length: size }, (_, k) => songs[(start + k) % songs.length])

  return {
    id: 2000 + i,
    name: PLAYLIST_NAMES[i % PLAYLIST_NAMES.length],
    coverImgUrl: `/api/mock-img/playlist/${2000 + i}.svg`,
    creator,
    createTime: now - int(60, 1200) * DAY,
    updateTime: now - int(1, 20) * DAY,
    tags: [PLAY_TAGS[i % PLAY_TAGS.length], PLAY_TAGS[(i + 3) % PLAY_TAGS.length]],
    description:
      `这是一张由「${creator.nickname}」创建的歌单。收录了 ${size} 首精心挑选的歌曲，` +
      `适合在安静的夜晚戴上耳机慢慢听。如果你也喜欢这些歌，欢迎收藏。`,
    playCount: int(10000, 5000000),
    subscribedCount: int(500, 90000),
    commentCount: int(10, 2000),
    shareCount: int(10, 900),
    subscribed: false,
    trackCount: tracks.length,
    trackIds: tracks.map((t) => ({ id: t.id })),
    tracks,
    toplist: false,
  }
}

const playlists = Array.from({ length: 16 }, (_, i) => makePlaylist(i))

// 四个榜单：榜单页要求 list 里至少有一项带 ToplistType（否则前端 TypeError）
const toplistMeta = [
  { id: 2101, name: '云音乐飙升榜', ToplistType: 'S', cover: 0 },
  { id: 2102, name: '云音乐新歌榜', ToplistType: 'N', cover: 1 },
  { id: 2103, name: '云音乐原创榜', ToplistType: 'O', cover: 2 },
  { id: 2104, name: '云音乐热歌榜', ToplistType: 'H', cover: 3 },
  { id: 2105, name: '华语金曲榜', ToplistType: '', cover: 4 },
  { id: 2106, name: '欧美热歌榜', ToplistType: '', cover: 5 },
  { id: 2107, name: '电音榜', ToplistType: '', cover: 6 },
  { id: 2108, name: '古风榜', ToplistType: '', cover: 7 },
]

const rankPlaylists = toplistMeta.map((meta, i) => {
  const base = playlists[meta.cover % playlists.length]
  const tracks = Array.from({ length: int(20, 40) }, (_, k) => songs[(i * 5 + k) % songs.length])
  return {
    ...base,
    id: meta.id,
    name: meta.name,
    coverImgUrl: `/api/mock-img/playlist/${meta.id}.svg`,
    tags: ['榜单'],
    description: `${meta.name}，每天更新，收录当下最受欢迎的歌曲。`,
    updateTime: now - int(0, 3) * DAY,
    trackIds: tracks.map((t) => ({ id: t.id })),
    tracks,
    trackCount: tracks.length,
    toplist: true,
    ToplistType: meta.ToplistType,
  }
})

const allPlaylists = [...playlists, ...rankPlaylists]
const playlistById = new Map(allPlaylists.map((p) => [p.id, p]))

function makeMv(i) {
  const singer = singers[i % singers.length]
  return {
    id: 5000 + i,
    name: MV_NAMES[i % MV_NAMES.length],
    cover: `/api/mock-img/mv/${5000 + i}.svg`,
    imgurl: `/api/mock-img/mv/${5000 + i}.svg`,
    artistId: singer.id,
    artistName: singer.name,
    artists: [{ id: singer.id, name: singer.name }],
    playCount: int(10000, 8000000),
    publishTime: now - int(10, 1500) * DAY,
    duration: int(150, 320) * 1000,
    desc: `《${MV_NAMES[i % MV_NAMES.length]}》官方音乐录影带。由${singer.name}演唱，画面在城市的清晨与深夜之间切换，呼应歌曲关于「离别与重逢」的主题。`,
  }
}

const mvs = Array.from({ length: 30 }, (_, i) => makeMv(i))
const mvById = new Map(mvs.map((m) => [m.id, m]))

function makeDj(i) {
  const dj = {
    userId: 9000 + (i % 8),
    nickname: NICKNAMES[(i + 2) % NICKNAMES.length],
    avatarUrl: `/api/mock-img/user/${9000 + (i % 8)}.svg`,
  }
  return {
    id: 6000 + i,
    name: DJ_NAMES[i % DJ_NAMES.length],
    picUrl: `/api/mock-img/dj/${6000 + i}.svg`,
    rcmdtext: pick([
      '每天更新，伴你入睡',
      '精选华语独立音乐',
      '聊聊音乐背后的故事',
      '通勤路上的声音陪伴',
      '深夜emo但好听',
    ]),
    programCount: int(20, 400),
    subCount: int(1000, 300000),
    playCount: int(10000, 2000000),
    dj,
    desc: `《${DJ_NAMES[i % DJ_NAMES.length]}》是一档音乐分享类电台节目，主播${dj.nickname}。每期会围绕一个主题挑选若干首歌，聊聊它们的来历和听感。`,
    createTime: now - int(100, 1500) * DAY,
    subed: false,
  }
}

const djRadios = Array.from({ length: 12 }, (_, i) => makeDj(i))
const djById = new Map(djRadios.map((d) => [d.id, d]))

function makeComments(seed, count) {
  const list = Array.from({ length: count }, (_, i) => {
    const user = {
      userId: 8000 + ((seed + i) % 16),
      nickname: NICKNAMES[(seed + i) % NICKNAMES.length],
      avatarUrl: `/api/mock-img/user/${8000 + ((seed + i) % 16)}.svg`,
    }
    return {
      commentId: 700000 + seed * 100 + i,
      user,
      content: COMMENT_TEXTS[(seed + i) % COMMENT_TEXTS.length],
      time: now - int(1, 400) * DAY,
      likedCount: int(0, 5000),
      liked: false,
      beReplied: i === 2
        ? [{
            beRepliedCommentId: 700000 + seed * 100,
            user: { userId: user.userId, nickname: user.nickname },
            content: COMMENT_TEXTS[seed % COMMENT_TEXTS.length],
          }]
        : [],
    }
  })
  return list
}

function makeLyric(song) {
  const offset = 0
  const lines = [
    `[00:00.00]${song.name}`,
    `[00:02.50]演唱：${song.ar[0].name}`,
    `[00:06.00]作词：佚名`,
    `[00:09.00]作曲：佚名`,
    `[00:13.00]`,
    `[00:15.00]风穿过长街 吹散了旧梦`,
    `[00:21.50]我把心事 折进信封`,
    `[00:27.00]寄往没有地址的远方`,
    `[00:33.00]那里可有人 听得懂`,
    `[00:39.00]`,
    `[00:41.00]时间是一条安静的河`,
    `[00:47.50]带走了少年 留下了我`,
    `[00:53.00]如果重逢 还有一句话要说`,
    `[00:59.00]那就说 别来无恙`,
    `[01:05.00]`,
    `[01:07.00]啦啦啦 啦啦啦`,
    `[01:13.00]唱给每一个赶路的人`,
    `[01:19.00]愿你被这世界 温柔以待`,
    `[01:25.00]愿你想念的人 也在想你`,
    `[01:31.00]`,
    `[01:33.00]（间奏）`,
    `[01:45.00]`,
    `[01:47.00]时间是一条安静的河`,
    `[01:53.50]带走了少年 留下了我`,
    `[01:59.00]如果重逢 还有一句话要说`,
    `[02:05.00]那就说 别来无恙`,
    `[02:11.00]`,
    `[02:13.00]别来无恙`,
    `[02:19.00]`,
    `[02:24.00]—— 完 ——`,
  ]
  return { lyric: lines.join('\n'), offset }
}

// ---------------------------------------------------------------- 占位图

// 把 id 映射回名称，供 /api/mock-img/*.svg 生成图上的文字
function labelFor(kind, id) {
  const n = Number(id)
  switch (kind) {
    case 'song': return songById.get(n)?.name
    case 'album': return albums.find((a) => a.id === n)?.name
    case 'playlist': return playlistById.get(n)?.name
    case 'artist': return singers.find((s) => s.id === n)?.name
    case 'dj': return djById.get(n)?.name
    case 'mv': return mvById.get(n)?.name
    case 'user': return NICKNAMES[n % NICKNAMES.length]
    default: return undefined
  }
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// 生成一张纯本地 SVG 占位图：渐变底 + 居中文字，不依赖任何外网图床
function makeCoverSvg(kind, id, shape = 'square') {
  const seed = hashCode(`${kind}-${id}`)
  const hue = seed % 360
  const hue2 = (hue + 40) % 360
  const raw = labelFor(kind, id) || `${kind} ${id}`
  const size = shape === 'circle' ? 120 : 300
  const half = size / 2

  // 中文按 1 个字宽、其他按 0.55 估算，据此缩字号并截断，避免文字溢出色块
  const width = (s) => [...s].reduce((n, c) => n + (/[一-龥]/.test(c) ? 1 : 0.55), 0)
  const maxWidth = size * 0.84
  let text = [...raw].slice(0, shape === 'circle' ? 4 : 12).join('')
  if (width(text) > maxWidth) {
    let acc = '', w = 0
    for (const c of text) {
      const cw = /[一-龥]/.test(c) ? 1 : 0.55
      if (w + cw > maxWidth - 0.6) break
      acc += c
      w += cw
    }
    text = acc + '…'
  }
  const fontSize = Math.max(
    size * 0.075,
    Math.min(size * 0.13, (size * 0.84) / Math.max(width(text), 1))
  )

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},62%,68%)"/>
      <stop offset="100%" stop-color="hsl(${hue2},58%,48%)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${shape === 'circle' ? half : 8}" fill="url(#g)"/>
  <text x="${half}" y="${half}" fill="#fff" font-size="${fontSize.toFixed(1)}"
        font-family="-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif"
        font-weight="600" text-anchor="middle" dominant-baseline="central">${esc(text)}</text>
</svg>`
}

export const albumById = new Map(albums.map((a) => [a.id, a]))
export const singerById = new Map(singers.map((s) => [s.id, s]))

export {
  NCM_BASE,
  singers,
  albums,
  songs,
  playlists,
  rankPlaylists,
  allPlaylists,
  mvs,
  djRadios,
  songById,
  playlistById,
  mvById,
  djById,
  privilegesFor,
  makeComments,
  makeLyric,
  makeCoverSvg,
  NICKNAMES,
  PLAY_TAGS,
  int,
  pick,
}
