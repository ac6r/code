import utils from '@/utils/util'

export default class Song {
    constructor({
        id,
        name,
        mvId,
        singer,
        album,
        alia,
        duration,
        url,
        vip,
        license,
        publishTime,

    }) {
        this.id = id
        this.name = name
        this.mvId = mvId
        this.singer = singer
        this.album = album
        // 歌曲详情页会执行 alia.join(' / ')，接口偶尔不返回该字段，
        // 这里兜底成空数组，避免整页 TypeError。
        this.alia = alia || []
        this.duration = duration
        this.url = url
        this.vip = vip
        this.license = license
        this.publishTime = publishTime
    }
}

export function formatSongInfo(params) {
    return new Song({
        id: String(params.id),
        name: params.name,
        mvId: params.mv,
        singer: params.ar,
        album: params.al,
        alia: params.alia,
        vip: params.fee === 1,
        license: params.license,
        duration: utils.formatSongTime(params.dt),
        // 后端若直接给了播放地址（本地 mock 数据会指向 public/1.mp3、2.mp3）就用它，
        // 真实网易云接口不返回该字段，仍然回落到官方外链。
        url: params.url || `https://music.163.com/song/media/outer/url?id=${params.id}.mp3`,
        publishTime: utils.formatMsgTime(params.publishTime)
    })
}