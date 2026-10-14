// 平滑的窗口尺寸过渡：按帧对 bounds 做插值 + 缓动，避免最大化/还原时的生硬跳变。

const FRAME_MS = 1000 / 60

// easeOutCubic：起步快、收尾慢，看起来最“顺”
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * 把窗口平滑地过渡到目标 bounds
 * @param {import('electron').BrowserWindow} win
 * @param {{x:number,y:number,width:number,height:number}} target
 * @param {number} duration 毫秒
 */
export function animateWindowBounds(win, target, duration = 220) {
  return new Promise((resolve) => {
    if (!win || win.isDestroyed()) return resolve()

    // 每次动画带一个 token：新动画会让旧动画自行退出（可被打断，避免连点错乱）
    const token = Symbol('window-animation')
    win.__animToken = token
    const isCurrent = () => !win.isDestroyed() && win.__animToken === token

    const start = win.getBounds()
    const keys = ['x', 'y', 'width', 'height']
    const startAt = Date.now()

    const tick = () => {
      if (!isCurrent()) return resolve()

      const progress = Math.min(1, (Date.now() - startAt) / duration)
      const eased = easeOutCubic(progress)
      const next = {}
      for (const key of keys) {
        next[key] = Math.round(start[key] + (target[key] - start[key]) * eased)
      }

      try {
        win.setBounds(next)
      } catch (err) {
        return resolve()
      }

      if (progress >= 1) return resolve()
      setTimeout(tick, FRAME_MS)
    }

    tick()
  })
}

export default { animateWindowBounds }
