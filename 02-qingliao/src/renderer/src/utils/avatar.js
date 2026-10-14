// 本地生成头像：根据昵称 + 唯一 ID 生成确定性的 SVG 头像（data URI）。
// 完全不依赖网络，随时都能立刻显示，不会出现灰块或加载失败。

const PALETTE = [
  '#5B8FF9',
  '#61DDAA',
  '#65789B',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
  '#008685',
  '#F08BB4'
]

function hashString(str) {
  // FNV-1a：混入每个字符后再取模，颜色分布更均匀，避免相邻 ID 撞色
  let hash = 2166136261
  const text = String(str || '')
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })
}

// 取昵称的第一个字符（兼容 emoji / 中英文）
export function avatarInitial(name) {
  const text = String(name || '').trim()
  if (!text) return '?'
  return Array.from(text)[0]
}

// 同一个 ID 永远得到同一个颜色
export function avatarColor(seed) {
  return PALETTE[hashString(seed) % PALETTE.length]
}

// 生成头像的 data URI（size 为边长像素）
export function avatarDataUri(name, seed, size = 64) {
  const initial = escapeXml(avatarInitial(name))
  const bg = avatarColor(seed || name)
  const radius = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.5)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>` +
    `<text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="#ffffff" ` +
    `font-family="PingFang SC, Microsoft YaHei, Helvetica, Arial, sans-serif" ` +
    `font-size="${fontSize}" font-weight="500">${initial}</text>` +
    `</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export default { avatarInitial, avatarColor, avatarDataUri }
