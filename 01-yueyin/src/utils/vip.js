import { h } from 'vue'

// ---------------------------------------------------------------------------
// VIP / 版权 相关的统一判定与提示
//
// 说明：本项目不做任何绕过付费墙的处理。VIP 歌曲与无版权歌曲一律不加入播放列表、
// 不请求播放地址，点击时给出明确说明并引导用户到官方渠道开通会员。
// ---------------------------------------------------------------------------

// 网易云音乐官方会员入口（会跳转到官方的会员套餐页）
export const VIP_PAGE = 'https://music.163.com/vip'

export const VIP_TIP = 'VIP 专属歌曲，需开通会员后收听'
export const LICENSE_TIP = '该歌曲暂无版权，暂时无法播放'

// 歌曲能否播放：VIP 与 无版权 都不行
export function canPlaySong(song) {
    return !!song && !song.vip && !song.license
}

// 不能播放的原因；可以播放时返回空串
export function unplayableReason(song) {
    if (!song) return '暂无可播放的歌曲'
    if (song.vip) return VIP_TIP
    if (song.license) return LICENSE_TIP
    return ''
}

// 统一的“不可播放”提示：说清原因；VIP 歌曲再给一个去官方开通的入口。
// 第二个参数可以传组件的 proxy（用它的 $msg），也可以直接传消息函数本身
// （播放器这类没有 proxy 的场景用 ElMessage）。
// 返回值：是否给出了提示
export function tipUnplayable(target, song) {
    const reason = unplayableReason(song)
    if (!reason) return false

    const msg = typeof target === 'function' ? target : target && target.$msg
    if (typeof msg !== 'function') return false

    if (!song || !song.vip) {
        msg({ type: 'info', message: reason, duration: 3500 })
        return true
    }

    msg({
        type: 'warning',
        duration: 5000,
        message: h('span', null, [
            h('span', null, reason + '，'),
            h(
                'a',
                {
                    style: 'color:#ff641e;cursor:pointer;font-weight:600',
                    onClick: () => window.open(VIP_PAGE, '_blank')
                },
                '去官方开通会员 >'
            )
        ])
    })
    return true
}

export default { VIP_PAGE, VIP_TIP, LICENSE_TIP, canPlaySong, unplayableReason, tipUnplayable }
