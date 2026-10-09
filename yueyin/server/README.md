# 本地后端（悦音 API 网关）

前端的 `baseURL` 是 `/api/`，由 vite 代理到 `http://localhost:3000`。
这个目录就是跑在 3000 上的服务。

## 启动

```bash
npm run dev          # 一条命令同时起「API 网关 + vite」，日常用这个
```

其他脚本：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 网关 + vite 一起起（推荐） |
| `npm run dev:vite` | 只起 vite，自己另开终端跑 `npm run server` |
| `npm run server` | 只起 API 网关 |
| `MOCK_ONLY=1 npm run dev` | 强制只用本地 mock 数据，不连网易云 |

## 数据从哪来

网关按「**真实网易云 API 优先，失败自动回落到本地 mock**」工作：

```
浏览器 → vite(9999) → 网关(3000) → ┬─ 真实 NeteaseCloudMusicApi(3001)
                                   └─ 本地 mock 数据（兜底）
```

- 真实 API 以子进程方式起在 3001，详见 `netease.cjs`。
- 每个请求先转发到 3001。**连接失败 / 超时 / 5xx / 返回空数据 / 返回畸形 JSON** 时，
  自动改用 `mock/handlers.js` 里的本地数据。
- 熔断按**接口路径**粒度：某个接口上游不可用（比如要登录才返回内容），
  只对该路径冷却 30 秒，不影响其他接口。
- 因此**有没有网络、有没有装网易云 API，页面都不会空白**。

## 文件

| 文件 | 说明 |
| --- | --- |
| `api-server.js` | 网关主程序，监听 3000 |
| `netease.cjs` | 启动真实 NeteaseCloudMusicApi（必须是 `.cjs`，见下） |
| `dev.mjs` | `npm run dev` 入口，同时拉起网关和 vite |
| `mock/data.js` | 本地假数据 + 离线占位图（SVG）生成 |
| `mock/handlers.js` | 各接口的 mock 响应，字段按前端实际读取的结构构造 |

## 两个容易踩的坑

1. **`server/*.cjs` 必须用 `.cjs` 后缀。**
   `package.json` 里是 `"type": "module"`，`.js` 会被当成 ESM，
   而 NeteaseCloudMusicApi 是 CommonJS 包、只能用 `require` 加载。

2. **转发时必须带上 query。**
   网易云接口几乎全靠 query 传参，只转发 `pathname` 会让上游收到无参请求并返回 400
   （接口会静默回落到 mock，表现为「怎么全是假数据」）。

## 离线占位图

mock 数据的封面/头像都指向 `/api/mock-img/<类型>/<id>.svg`，
由网关实时生成渐变 SVG，**不依赖任何外网图床**，断网也有图。

本地账号播放的音源用仓库里已有的 `public/1.mp3`、`public/2.mp3`
（见 `mock/data.js` 里歌曲的 `url` 字段）。真实网易云接口不返回 `url` 字段，
所以 `src/utils/song.js` 里是「有 url 用它，没有才回落到官方外链」。
