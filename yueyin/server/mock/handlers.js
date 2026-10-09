// 本地 mock 路由表：按前端实际读取的字段构造响应。
// 每个 handler 返回 { status, json }；返回 null 表示"这个路径我不认识"，
// 由上层决定怎么处理。
import {
  singers,
  albums,
  songs,
  playlists,
  rankPlaylists,
  allPlaylists,
  mvs,
  djRadios,
  songById,
  albumById,
  playlistById,
  mvById,
  djById,
  singerById,
  privilegesFor,
  makeComments,
  makeLyric,
  NICKNAMES,
  PLAY_TAGS,
  int,
} from './data.js'

const now = Date.now()

// 没有本地 mp4 资源，给一个公开的测试视频。
// 离线时视频加载不出来，但 src 有值 => MV 详情页的 v-if 成立，页面不会空白。
const FALLBACK_VIDEO = 'https://media.w3.org/2010/05/sintel/trailer.mp4'

const ok = (json) => ({ status: 200, json: { code: 200, ...json } })

// 分页：按 limit/offset 切片，并算出是否还有更多
function paginate(list, query, defaultLimit = 30) {
  const limit = Number(query.limit ?? defaultLimit)
  const offset = Number(query.offset ?? 0)
  return {
    slice: list.slice(offset, offset + limit),
    hasMore: offset + limit < list.length,
    total: list.length,
  }
}

// 歌单必须 tracks / trackIds / privileges 三者同序对齐
function playlistPayload(playlist) {
  return {
    playlist: {
      ...playlist,
      trackIds: playlist.tracks.map((t) => ({ id: t.id })),
      trackCount: playlist.tracks.length,
    },
    privileges: privilegesFor(playlist.tracks),
  }
}

// 详情页侧栏 / 相似推荐里的精简歌单卡片
const briefPlaylist = (p) => ({
  id: p.id,
  name: p.name,
  coverImgUrl: p.coverImgUrl,
  creator: p.creator,
  playCount: p.playCount,
  trackCount: p.trackCount,
})

const briefUser = (i) => ({
  userId: 8000 + (i % 16),
  nickname: NICKNAMES[i % NICKNAMES.length],
  avatarUrl: `/api/mock-img/user/${8000 + (i % 16)}.svg`,
})

// ---------------------------------------------------------------- 路由

const routes = {
  // ---------- 首页 ----------
  '/banner': () => ok({
    banners: [
      { imageUrl: '/api/mock-img/song/1000.svg', typeTitle: '新歌首发', targetType: 1, targetId: 1000, url: null },
      { imageUrl: '/api/mock-img/playlist/2000.svg', typeTitle: '热门歌单', targetType: 1000, targetId: 2000, url: null },
      { imageUrl: '/api/mock-img/artist/3001.svg', typeTitle: '歌手推荐', targetType: 100, targetId: 3001, url: null },
      { imageUrl: '/api/mock-img/mv/5000.svg', typeTitle: '最新MV', targetType: 1004, targetId: 5000, url: null },
      { imageUrl: '/api/mock-img/album/4000.svg', typeTitle: '新碟上架', targetType: 10, targetId: 4000, url: null },
    ],
  }),

  '/toplist': () => ok({
    list: rankPlaylists.map((p) => ({
      id: p.id,
      name: p.name,
      coverImgUrl: p.coverImgUrl,
      updateTime: p.updateTime,
      updateFrequency: '每天更新',
      trackCount: p.trackCount,
      playCount: p.playCount,
      ToplistType: p.ToplistType,
    })),
  }),

  '/toplist/detail': () => ok({
    list: rankPlaylists.map((p) => ({
      id: p.id,
      name: p.name,
      coverImgUrl: p.coverImgUrl,
      updateTime: p.updateTime,
      updateFrequency: '每天更新',
      trackCount: p.trackCount,
      playCount: p.playCount,
      ToplistType: p.ToplistType,
    })),
  }),

  '/top/playlist': ({ query }) => {
    // 榜单歌单不混进歌单广场
    const { slice, hasMore, total } = paginate(playlists, query, 50)
    return ok({ playlists: slice.map(briefPlaylist), total, more: hasMore, cat: query.cat || '全部' })
  },

  '/playlist/hot': () => ok({
    tags: [
      { id: 1, name: '华语' },
      { id: 2, name: '流行' },
      { id: 3, name: '民谣' },
      { id: 4, name: '摇滚' },
      { id: 5, name: '电子' },
      { id: 6, name: '轻音乐' },
      { id: 7, name: '粤语' },
      { id: 8, name: '古风' },
    ],
    code: 200,
  }),

  '/playlist/catlist': () => ok({
    sub: [
      { name: '华语', category: 0 },
      { name: '流行', category: 0 },
      { name: '摇滚', category: 1 },
      { name: '民谣', category: 1 },
      { name: '电子', category: 1 },
      { name: '轻音乐', category: 2 },
      { name: '治愈', category: 2 },
      { name: '运动', category: 3 },
      { name: '复古', category: 3 },
    ],
    categories: { 0: '语种', 1: '风格', 2: '场景', 3: '情感' },
    all: { name: '全部歌单', id: 0, category: -1 },
  }),

  '/top/artists': ({ query }) => {
    const { slice } = paginate(singers, query, 36)
    return ok({
      artists: slice.map((s) => ({
        id: s.id, name: s.name, picUrl: s.picUrl,
        albumSize: s.albumSize, musicSize: s.musicSize, fansCount: s.fansCount,
      })),
      more: false,
    })
  },

  '/top/album': ({ query }) => {
    const { slice } = paginate(albums, query, 12)
    return ok({
      monthData: slice.map((a) => ({
        id: a.id, name: a.name, picUrl: a.picUrl, type: a.type,
        publishTime: a.publishTime, artist: { id: a.artist.id, name: a.artist.name },
      })),
      hasMore: false,
      code: 200,
    })
  },

  // ---------- 歌单 ----------
  '/playlist/detail': ({ query }) => {
    const p = playlistById.get(Number(query.id)) || synthPlaylist(Number(query.id))
    return ok(playlistPayload(p))
  },

  '/playlist/subscribers': ({ query }) => {
    const limit = Number(query.limit ?? 20)
    const offset = Number(query.offset ?? 0)
    const list = Array.from({ length: 40 }, (_, i) => briefUser(i + offset))
    return ok({ subscribers: list.slice(0, limit), total: 40, more: offset + limit < 40 })
  },

  '/related/playlist': ({ query }) => {
    const id = Number(query.id)
    const others = allPlaylists.filter((p) => p.id !== id).slice(0, 6)
    return ok({ playlists: others.map(briefPlaylist) })
  },

  '/comment/playlist': ({ query }) => {
    const id = Number(query.id) || 2000
    const limit = Number(query.limit ?? 20)
    const offset = Number(query.offset ?? 0)
    const all = makeComments(id % 97, 30)
    return ok({
      total: all.length,
      more: offset + limit < all.length,
      hotComments: all.slice(0, 3),
      comments: all.slice(offset, offset + limit),
    })
  },

  // ---------- 歌曲 ----------
  // POST，body 是 JSON { ids: '1,2,3' }
  'POST_/song/detail': ({ body }) => {
    const raw = typeof body === 'string' ? safeParse(body) : body
    const ids = String(raw?.ids ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean)
    // 未知 id（比如真实 API 混用时）不返回，避免前端 formatSongs 下标错位
    const found = ids.map((id) => songById.get(id) || synthSong(id)).filter(Boolean)
    return ok({ songs: found, privileges: privilegesFor(found) })
  },

  '/simi/song': ({ query }) => {
    const id = Number(query.id)
    const start = songs.findIndex((s) => s.id === id)
    const base = start >= 0 ? start : 0
    const list = Array.from({ length: 10 }, (_, k) => songs[(base + k + 1) % songs.length])
    // 注意：/simi/song 用的是 v1 字段（mvid / artists / album / alias / duration）
    return ok({
      songs: list.map((s) => ({
        id: s.id,
        name: s.name,
        mvid: s.mv,
        artists: s.ar,
        album: s.al,
        alias: s.alia,
        duration: s.dt,
        fee: s.fee,
        license: !(s._cp ?? 1),
        publishTime: s.publishTime,
        url: s.url,
      })),
    })
  },

  '/simi/playlist': ({ query }) => {
    const id = Number(query.id)
    const others = allPlaylists.filter((p) => p.id !== id).slice(0, 6)
    return ok({ playlists: others.map(briefPlaylist) })
  },

  '/lyric': ({ query }) => {
    const song = songById.get(Number(query.id)) || synthSong(Number(query.id))
    return ok({ lrc: makeLyric(song), tlyric: { lyric: '' }, klyric: { lyric: '' } })
  },

  // ---------- 评论 ----------
  '/comment/music': commentRoute,
  '/comment/mv': commentRoute,
  '/comment/album': commentRoute,
  '/comment/video': commentRoute,

  '/comment': () => ok({}),
  '/comment/like': () => ok({}),

  // ---------- 专辑 ----------
  '/album': ({ query }) => {
    const album = albumById.get(Number(query.id)) || synthAlbum(Number(query.id))
    const list = songs.filter((s) => s.al.id === album.id).slice(0, album.size)
    const filled = list.length ? list : songs.slice(0, 10)
    return ok({
      album,
      songs: filled.map((s) => ({ ...s, privilege: { id: s.id, cp: s._cp ?? 1, fee: s.fee } })),
    })
  },

  '/album/detail/dynamic': () => ok({ isSub: 0, subCount: int(100, 9000), commentCount: int(10, 500), shareCount: 12, likedCount: 88 }),

  // ---------- 歌手 ----------
  '/artist/list': ({ query }) => {
    const { slice, hasMore } = paginate(singers, query, 30)
    return ok({
      artists: slice.map((s) => ({
        id: s.id, name: s.name, picUrl: s.picUrl,
        followed: s.followed, albumSize: s.albumSize,
        musicSize: s.musicSize, fansCount: s.fansCount,
      })),
      more: hasMore,
    })
  },

  '/artists': ({ query }) => {
    const artist = singerById.get(Number(query.id)) || synthArtist(Number(query.id))
    const hotSongs = artistSongs(artist, 12)
    return ok({
      artist,
      hotSongs: hotSongs.map((s) => ({ ...s, license: !(s._cp ?? 1) })),
    })
  },

  '/artist/desc': ({ query }) => {
    const artist = singerById.get(Number(query.id)) || synthArtist(Number(query.id))
    return ok({ briefDesc: artist.briefDesc, introduction: [], topicData: [] })
  },

  '/artist/album': ({ query }) => {
    const artist = singerById.get(Number(query.id)) || synthArtist(Number(query.id))
    const list = artistAlbums(artist, 6)
    const { slice } = paginate(list, query, 50)
    return ok({
      hotAlbums: slice.map((a) => ({
        id: a.id, name: a.name, picUrl: a.picUrl, type: a.type,
        publishTime: a.publishTime, size: a.size,
        artist: { id: a.artist.id, name: a.artist.name },
      })),
      more: false,
    })
  },

  '/artist/mv': ({ query }) => {
    const id = Number(query.id)
    const artist = singerById.get(id) || synthArtist(id)
    const list = artistMvs(artist, 6)
    const { slice } = paginate(list, query, 50)
    return ok({ mvs: slice.map(mvBrief), hasMore: false })
  },

  // ---------- MV ----------
  '/mv/all': ({ query }) => {
    const { slice, hasMore } = paginate(mvs, query, 30)
    return ok({ data: slice.map(mvBrief), hasMore })
  },

  // 注意参数名是 mvid
  '/mv/detail': ({ query }) => {
    const mv = mvById.get(Number(query.mvid)) || synthMv(Number(query.mvid))
    return ok({
      data: {
        id: mv.id, name: mv.name, cover: mv.cover, desc: mv.desc,
        publishTime: mv.publishTime, playCount: mv.playCount,
        duration: mv.duration, artists: mv.artists,
      },
    })
  },

  '/mv/url': ({ query }) => ok({ data: { id: Number(query.id), url: FALLBACK_VIDEO, r: 1080 } }),

  '/simi/mv': ({ query }) => {
    const id = Number(query.mvid)
    const others = mvs.filter((m) => m.id !== id).slice(0, 8)
    return ok({ mvs: others.map(mvBrief) })
  },

  // ---------- 电台 ----------
  '/dj/hot': ({ query }) => {
    const { slice } = paginate(djRadios, query, 30)
    return ok({
      djRadios: slice.map((d) => ({
        id: d.id, name: d.name, picUrl: d.picUrl, rcmdtext: d.rcmdtext,
        programCount: d.programCount, subCount: d.subCount, playCount: d.playCount,
        dj: d.dj,
      })),
      hasMore: false,
    })
  },

  '/dj/detail': ({ query }) => {
    const d = djById.get(Number(query.rid)) || synthDj(Number(query.rid))
    return ok({
      data: {
        id: d.id, name: d.name, picUrl: d.picUrl, desc: d.desc,
        createTime: d.createTime, playCount: d.playCount,
        subCount: d.subCount, programCount: d.programCount,
        subed: d.subed, dj: d.dj,
      },
    })
  },

  '/dj/program': ({ query }) => {
    const d = djById.get(Number(query.rid)) || synthDj(Number(query.rid))
    const count = Number(query.limit ?? 30)
    const programs = Array.from({ length: Math.min(count, 30) }, (_, i) => {
      const s = songs[(d.id + i) % songs.length]
      return {
        id: 800000 + i,
        name: `${s.name} | 第 ${i + 1} 期`,
        mainSong: s,
        coverUrl: d.picUrl,
        createTime: now - int(1, 300) * 86400000,
        listenerCount: int(100, 9000),
        duration: s.dt,
      }
    })
    return ok({ programs, more: false })
  },

  '/dj/sub': () => ok({}),

  // ---------- 搜索 ----------
  // type: 1 单曲 / 10 专辑 / 100 歌手 / 1000 歌单 / 1004 MV
  '/cloudsearch': ({ query }) => {
    const kw = decodeKw(query.keywords).trim()
    const type = Number(query.type) || 1
    const limit = Number(query.limit ?? 30)
    const offset = Number(query.offset ?? 0)

    const pools = {
      1: { items: songs, countKey: 'songCount', dataKey: 'songs', match: (s) => hit(s.name, kw) || s.ar.some((a) => hit(a.name, kw)) || hit(s.al.name, kw) },
      10: { items: albums, countKey: 'albumCount', dataKey: 'albums', match: (a) => hit(a.name, kw) || hit(a.artist.name, kw) },
      100: { items: singers, countKey: 'artistCount', dataKey: 'artists', match: (s) => hit(s.name, kw) },
      1000: { items: allPlaylists, countKey: 'playlistCount', dataKey: 'playlists', match: (p) => hit(p.name, kw) || hit(p.creator?.nickname, kw) },
      1004: { items: mvs, countKey: 'mvCount', dataKey: 'mvs', match: (m) => hit(m.name, kw) || hit(m.artistName, kw) },
    }

    const pool = pools[type]
    if (!pool) return ok({ result: {} })

    let matched = kw ? pool.items.filter(pool.match) : pool.items
    // 关键词在本地素材里没命中时，按关键词哈希取一段，保证演示时页面有内容
    if (!matched.length) {
      const start = hash(kw) % pool.items.length
      matched = Array.from({ length: Math.min(pool.items.length, 40) }, (_, i) => pool.items[(start + i) % pool.items.length])
    }

    const page = matched.slice(offset, offset + limit)
    const result = {
      [pool.dataKey]: page.map((item) => searchItem(type, item)),
      [pool.countKey]: matched.length,
    }
    return ok({ result })
  },

  '/search/hot': () => ok({
    result: {
      hots: [
        { first: '夜航船' },
        { first: '浮生若梦' },
        { first: '山海不可平' },
        { first: '成都' },
        { first: '海阔天空' },
        { first: '理想三旬' },
      ],
    },
  }),

  '/search/suggest': ({ query }) => {
    const kw = decodeKw(query.keywords) || '夜'
    const hitSongs = songs.filter((s) => s.name.includes(kw)).slice(0, 5)
    const hitArtists = singers.filter((s) => s.name.includes(kw)).slice(0, 3)
    const hitAlbums = albums.filter((a) => a.name.includes(kw)).slice(0, 3)
    const hitPlaylists = playlists.filter((p) => p.name.includes(kw)).slice(0, 3)

    // 关键词没命中时给一组默认结果，避免下拉框一直是空的
    const songList = hitSongs.length ? hitSongs : songs.slice(0, 5)
    const artistList = hitArtists.length ? hitArtists : singers.slice(0, 3)
    const albumList = hitAlbums.length ? hitAlbums : albums.slice(0, 3)
    const playlistList = hitPlaylists.length ? hitPlaylists : playlists.slice(0, 3)

    return ok({
      result: {
        // 前端按 order 的 key 去取数组，缺失会导致下拉框一直 loading
        order: ['songs', 'artists', 'albums', 'playlists'],
        songs: songList.map((s) => ({ id: s.id, name: s.name, artists: s.ar })),
        artists: artistList.map((s) => ({ id: s.id, name: s.name })),
        albums: albumList.map((a) => ({ id: a.id, name: a.name, artist: a.artist })),
        playlists: playlistList.map((p) => ({ id: p.id, name: p.name })),
      },
    })
  },

  // ---------- 用户 / 登录 ----------
  '/login/cellphone': () => ({
    status: 200,
    json: {
      code: 200,
      msg: 'mock 环境未接入真实网易云账号，请用「注册」创建本地账号登录',
      profile: null,
      token: '',
      cookie: '',
    },
  }),

  '/user/detail': ({ query }) => ok({
    profile: {
      userId: Number(query.uid) || 9000,
      nickname: 'mock 用户',
      avatarUrl: `/api/mock-img/user/${Number(query.uid) || 9000}.svg`,
      follows: 12,
      followeds: 34,
      level: 8,
      // 注意：前端读的是 signnature（拼写如此），不是 signature
      signnature: '这个人很懒，什么都没写~',
    },
  }),

  '/user/playlist': ({ query }) => {
    const uid = Number(query.uid) || 9000
    const mine = playlists.slice(0, 3).map((p) => ({ ...briefPlaylist(p), userId: uid }))
    const subs = playlists.slice(3, 8).map((p) => ({ ...briefPlaylist(p), userId: 1111 }))
    return ok({ playlist: [...mine, ...subs], more: false })
  },

  // ---------- 写操作：mock 下一律返回成功 ----------
  '/logout': () => ok({}),
  // 收藏单曲需要登录态，mock 下直接当作成功
  '/like': () => ok({}),
  '/playlist/subscribe': () => ok({}),
  '/album/sub': () => ok({}),
  '/artist/sub': () => ok({}),
  '/check/music': () => ok({ success: true, message: 'ok' }),
}

// ---------------------------------------------------------------- 内部

function commentRoute({ query }) {
  const id = Number(query.id) || 1000
  const limit = Number(query.limit ?? 20)
  const offset = Number(query.offset ?? 0)
  const all = makeComments(id % 89, 30)
  return ok({
    total: all.length,
    more: offset + limit < all.length,
    hotComments: offset === 0 ? all.slice(0, 4) : [],
    comments: all.slice(offset, offset + limit),
  })
}

function mvBrief(m) {
  return {
    id: m.id, name: m.name, cover: m.cover, imgurl: m.imgurl,
    artistId: m.artistId, artistName: m.artistName,
    playCount: m.playCount, publishTime: m.publishTime, duration: m.duration,
  }
}

// 真实 API 与 mock 可能混用：列表页由真实 API 提供（真实 id），
// 详情接口却回落到 mock。这时 mock 会收到自己不认识的真实 id，
// 现场合成一份数据，保证详情页永远有内容而不是空白。
function synthPlaylist(id) {
  const n = Math.abs(id) || 1
  const size = 12 + (n % 12)
  const tracks = Array.from({ length: size }, (_, k) => songs[(n + k) % songs.length])
  return {
    id,
    name: `歌单 #${n}`,
    coverImgUrl: `/api/mock-img/playlist/${id}.svg`,
    creator: {
      userId: 9000 + (n % 8),
      nickname: NICKNAMES[n % NICKNAMES.length],
      avatarUrl: `/api/mock-img/user/${9000 + (n % 8)}.svg`,
    },
    createTime: now - (n % 900) * 86400000,
    updateTime: now - (n % 20) * 86400000,
    tags: [PLAY_TAGS[n % PLAY_TAGS.length]],
    description: '本地 mock 数据：该歌单由真实接口与 mock 混用时的兜底生成。',
    playCount: 100000 + (n % 900000),
    subscribedCount: 1000 + (n % 50000),
    commentCount: n % 800,
    shareCount: n % 500,
    subscribed: false,
    trackIds: tracks.map((t) => ({ id: t.id })),
    tracks,
    trackCount: tracks.length,
    toplist: false,
  }
}

// 固定素材池里每位歌手名下的歌/专辑/MV 数量有限，歌手页会显得很空。
// 这里按需补足，保证任意歌手 id 的详情页都是满的。
function artistSongs(artist, count = 12) {
  const own = songs.filter((s) => s.ar[0].id === artist.id)
  const extra = []
  for (let k = own.length; k < count; k++) {
    const base = songs[(artist.id + k * 7) % songs.length]
    extra.push({ ...base, id: artist.id * 100 + k, ar: [artist], mv: 0, _cp: 1 })
  }
  return [...own, ...extra]
}

function artistAlbums(artist, count = 6) {
  const own = albums.filter((a) => a.artist.id === artist.id)
  const extra = []
  for (let k = own.length; k < count; k++) {
    const base = albums[(artist.id + k * 5) % albums.length]
    const id = artist.id * 10 + k
    extra.push({ ...base, id, picUrl: `/api/mock-img/album/${id}.svg`, artist, artists: [artist] })
  }
  return [...own, ...extra]
}

function artistMvs(artist, count = 6) {
  const own = mvs.filter((m) => m.artistId === artist.id)
  const extra = []
  for (let k = own.length; k < count; k++) {
    const base = mvs[(artist.id + k * 3) % mvs.length]
    const id = artist.id * 10 + k
    extra.push({
      ...base, id,
      cover: `/api/mock-img/mv/${id}.svg`,
      imgurl: `/api/mock-img/mv/${id}.svg`,
      artistId: artist.id, artistName: artist.name,
      artists: [{ id: artist.id, name: artist.name }],
    })
  }
  return [...own, ...extra]
}

function synthArtist(id) {
  const n = Math.abs(id) || 1
  const seed = singers[n % singers.length]
  // 保留请求的 id，这样歌手页内部的 /artist/album 等联动不会串到别的歌手
  return { ...seed, id, name: seed.name, picUrl: `/api/mock-img/artist/${id}.svg` }
}

function synthAlbum(id) {
  const n = Math.abs(id) || 1
  const seed = albums[n % albums.length]
  const artist = synthArtist(3000 + (n % 36))
  return { ...seed, id, picUrl: `/api/mock-img/album/${id}.svg`, artist, artists: [artist] }
}

function synthMv(id) {
  const n = Math.abs(id) || 1
  const seed = mvs[n % mvs.length]
  return { ...seed, id, cover: `/api/mock-img/mv/${id}.svg`, imgurl: `/api/mock-img/mv/${id}.svg` }
}

function synthDj(id) {
  const n = Math.abs(id) || 1
  const seed = djRadios[n % djRadios.length]
  return { ...seed, id, picUrl: `/api/mock-img/dj/${id}.svg` }
}

// 真实 API 与 mock 混用时可能拿到 mock 不认识的 id，
// 这里现场造一首，避免 formatSongs 因缺项而下标错位。
function synthSong(id) {
  const base = songs[Math.abs(id) % songs.length]
  return {
    ...base,
    id,
    ar: [{ id: 3000 + (id % 36), name: base.ar[0].name }],
    _cp: 1,
  }
}

function safeParse(s) {
  try { return JSON.parse(s) } catch { return null }
}

function decodeKw(v) {
  if (!v) return ''
  try { return decodeURIComponent(v) } catch { return v }
}

function hit(text, kw) {
  if (!kw) return false
  return String(text || '').toLowerCase().includes(kw.toLowerCase())
}

function hash(str) {
  let h = 0
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0
  return Math.abs(h)
}

// 把本地数据整理成搜索接口的字段形态（尽量贴近真实 /cloudsearch 的返回）
function searchItem(type, item) {
  switch (type) {
    case 1:
      // 搜索结果的单曲是 v2 字段，且每首歌自带 privilege
      return { ...item, privilege: { id: item.id, cp: item._cp ?? 1, fee: item.fee ?? 0, st: 0, pl: 0, dl: 0 } }
    case 10:
      return {
        id: item.id, name: item.name, picUrl: item.picUrl, type: item.type,
        publishTime: item.publishTime, size: item.size,
        artist: { id: item.artist.id, name: item.artist.name },
        artists: [{ id: item.artist.id, name: item.artist.name }],
      }
    case 100:
      return {
        id: item.id, name: item.name, picUrl: item.picUrl, followed: item.followed,
        albumSize: item.albumSize, musicSize: item.musicSize, fansSize: item.fansCount,
      }
    case 1000:
      return {
        id: item.id, name: item.name, coverImgUrl: item.coverImgUrl, creator: item.creator,
        trackCount: item.trackCount, playCount: item.playCount,
        officialTags: item.tags || [],
      }
    case 1004:
      return {
        id: item.id, name: item.name, cover: item.cover, playCount: item.playCount,
        artistId: item.artistId, artistName: item.artistName, duration: item.duration,
      }
    default:
      return item
  }
}

// POST /song/detail 单独挂在 POST_ 前缀下
export const POST_ROUTES = {
  '/song/detail': routes['POST_/song/detail'],
}

export const GET_ROUTES = Object.fromEntries(
  Object.entries(routes)
    .filter(([k]) => !k.startsWith('POST_'))
    .map(([k, v]) => [k, v])
)
