# code

前端项目集合，收录三个练习 / 面试项目，覆盖**音乐播放器**、**Electron 桌面客户端**、**后台管理系统**三种典型形态。

三个项目相互独立，各自安装依赖、各自启动。共同点：均为 Vue 3 组合式 API（`<script setup>`）编写，**均可在无后端的情况下本地跑起来**（数据由 mock 或本地网关提供）。

目录前的 `01-` / `02-` / `03-` 前缀仅用于控制展示顺序，不含其他含义。

## 项目一览

| 目录 | 项目 | 形态 | 技术栈 | 数据来源 |
| --- | --- | --- | --- | --- |
| [`01-yueyin/`](./01-yueyin) | 悦音音乐 | Web 单页应用 | Vue 3 · Vite · Pinia · Element Plus · Swiper | 本地 Node 网关（真实网易云 API + mock 回落） |
| [`02-qingliao/`](./02-qingliao) | 轻聊 EasyChat | Electron 桌面客户端 | Electron · Vue 3 · electron-vite · Element Plus | 前端 mock（vite-plugin-mock） |
| [`03-ecom-admin/`](./03-ecom-admin) | 电商后台管理 | Web 管理后台 | Vue 3 · Vite · Pinia · Element Plus · ECharts | 前端 mock（mockjs） |

---

## 01-yueyin — 悦音音乐播放器

仿网易云音乐的音乐播放器，支持播放、歌词、MV、电台、歌单、排行榜、搜索与本地账号体系。

### 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Vue | 3.5 | 核心框架，全部组合式 API |
| Vue Router | 4.6 | 路由（history 模式） |
| Pinia | 3.0 | 状态管理（单一 `player` store） |
| Element Plus | 2.14 | UI 组件（按需自动导入） |
| Swiper | 14 | 首页轮播 |
| Vite | 8.1 | 构建 / 开发服务器 |
| Less | 4.6 | 样式预处理器 |
| NeteaseCloudMusicApi | 4.32 | 真实网易云接口（可选安装） |

无 TypeScript、无 ESLint / Prettier 配置。图标为自定义 iconfont。

### 页面与路由

共 15 条路由，全部懒加载：

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/index` | 首页 | 轮播 Banner、推荐歌单、新碟上架、排行榜、最新 MV、热门电台、热门歌手 |
| `/rank` | 排行榜 | 左侧榜单详情，右侧 TOP榜 / 特色榜 / 场景榜切换 |
| `/playlist` | 歌单广场 | 分类筛选、热门 / 最新排序、滚动加载更多 |
| `/playlist/detail` | 歌单详情 | 封面信息、歌曲列表、收藏、相关歌单推荐、评论 |
| `/song` | 歌曲详情 | 黑胶唱片动画、歌词、相似歌曲、评论 |
| `/singer` | 歌手详情 | 歌手资料、热门歌曲、专辑、MV |
| `/album` | 专辑详情 | 专辑信息、包含歌曲、评论 |
| `/artist` | 歌手列表 | 按首字母 / 地区 / 类型筛选，无限滚动 |
| `/mvlist` | MV 列表 | 按排序 / 区域 / 类型筛选，无限滚动 |
| `/mvlist/mv` | MV 详情 | 视频播放、简介、相似 MV、评论 |
| `/dj` | 电台详情 | 电台信息、节目列表、订阅、热门电台 |
| `/search` | 搜索结果 | 单曲 / 歌手 / 专辑 / 歌单 / MV 五个 Tab |
| `/my` | 我的音乐 | 登录入口、我的歌单、收藏歌单 |
| `/user` | 用户主页 | **占位页，尚未实现** |

### 播放器功能

播放逻辑集中在 `src/components/PlayBarTmp/`（`PlayBar` 调度 → `AudioBox` 操作原生 `<audio>` → `Bar` / `MiniBar` 两套 UI）：

- 播放 / 暂停、上一首 / 下一首
- **三种播放模式**：列表循环 / 单曲循环 / 随机播放
- **进度条**：支持点击跳转、鼠标拖拽、触摸拖拽（拖拽中不实时 seek，松手才定位）
- **音量控制**：拖拽调音 + 静音，记忆上一次音量
- **歌词**：解析 LRC 时间轴，当前行高亮，超 6 行自动上滚，无歌词显示占位文案
- **播放列表弹窗**：数量角标（>99 显示 `99+`）、删除单曲、清空、按 id 去重添加
- **迷你播放器**：移动端（<768px）自动切换，圆形封面旋转动画
- **画中画（PiP）**：`canvas.captureStream()` 把封面投到画中画窗口
- **Media Session API**：接管系统媒体键
- **状态持久化**：播放列表与登录态存 localStorage，刷新可恢复
- 版权 / 付费歌曲（`fee === 1`）按钮置灰并提示

### 数据来源（三层结构）

```
浏览器 → vite (9999) → 本地网关 (3000) → 真实 NeteaseCloudMusicApi (3001)
                                      ↳ 失败时回落 → server/mock/ (本地假数据)
```

- `server/api-server.js` 是本地网关：先转发到 3001 的真实网易云 API，遇**连接失败 / 8s 超时 / 5xx / 畸形 JSON / 空数据**时自动回落本地 mock
- **熔断按接口粒度**：某接口连续失败 3 次后冷却 30 秒走 mock，不影响其他接口
- `server/netease.cjs` 以子进程启动真实 API（必须 `.cjs` 后缀——项目是 ESM，而该包是 CommonJS）
- 未安装 `NeteaseCloudMusicApi` 时打印提示并**纯用 mock**，页面不会空白
- 离线兜底：封面是网关实时生成的 SVG 占位图，音源用仓库内 `public/1.mp3`、`public/2.mp3`
- 另有 `src/mock/`（localStorage 实现的本地账号与收藏）——与网关的 mock 是**两回事**

### 运行

```bash
npm install
npm run dev        # 一条命令同时启动网关(3000) + vite(9999)
```

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 网关 + vite 一起启动（日常开发用） |
| `npm run server` | 只启动 API 网关（3000） |
| `npm run dev:vite` | 只启动 vite（9999） |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 预览构建产物（已单独配置 `preview.proxy`） |

离线演示：`MOCK_ONLY=1 npm run dev` 强制只用本地 mock。

### 注意事项

- **三层端口要分清楚**（9999 / 3000 / 3001），否则容易出现"页面空白 / 接口全 502"
- 网关转发必须带 query 参数，只传 pathname 会让网易云接口返回 400 并静默回落 mock
- `vite preview` 不读 `server.proxy`，所以 `vite.config.js` 里单独配了 `preview.proxy`
- 响应式：Less mixin + `useMobile` composable，PC 用侧边栏，移动端用底部 Tab Bar
- `index.html` 设了 `no-referrer`，用于规避网易云图片防盗链
- `img/` 目录备有 10 张实拍截图，可直接用于文档展示

---

## 02-qingliao — 轻聊 EasyChat

模仿微信界面的桌面 IM 客户端。登录/注册、联系人、搜索加好友、聊天收发等均由前端 mock 驱动，**仓库内不含后端服务**。

### 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Electron | 25.6 | 桌面框架 |
| electron-vite | 1.0 | 三进程一体化构建 |
| electron-builder | 24.6 | 打包分发 |
| Vue | 3.3 | 渲染进程框架 |
| Vue Router | 4.2 | 路由（hash 模式） |
| Pinia | 2.1 | 状态管理 |
| Element Plus | 2.4 | UI 组件 |
| vite-plugin-mock + mockjs | 3.0 / 1.1 | 接口 mock |
| electron-store | 8.1 | 主进程持久化 KV |

### 进程结构

- **主进程** `src/main/`：创建唯一 `BrowserWindow`（初始 300×370 登录尺寸，`transparent`，隐藏标题栏），注册三个 IPC 通道：`loginOrRegister`（切换窗口高度 370 ↔ 490）、`openChat`（登录后窗口调整为 850×800 并允许缩放）、`winTitleop`（置顶 / 最小化 / 最大化 / 关闭，关闭可隐藏到任务栏）
- **预加载** `src/preload/`：很薄，因 `contextIsolation: false`，渲染进程直接以 `window.ipcRenderer` 使用 IPC
- **渲染进程** `src/renderer/`：标准 Vue 3 SPA

### 页面与路由

```
/                        → 重定向 /login
/login                   登录 / 注册（双表单切换）
/main                    主窗口（左侧竖导航 + 账号切换器）
  ├── /main/chat                 聊天（左会话列表 / 右聊天窗）
  │     └── :contactId           会话详情
  ├── /main/contact              联系人（左分组 / 右内容）
  │     ├── blank                新的朋友
  │     ├── search               搜好友 / 群
  │     └── creatGroup           新建群聊（占位）
  └── /main/setting              设置
        ├── userinfo             账号设置
        ├── fileMange            文件管理（占位）
        └── about                关于轻聊（占位）
```

### 核心功能

- **认证**：邮箱注册 / 登录 + 图形验证码（mock 生成），密码 md5 后传输
- **会话与消息**：会话列表（联系人 + 群聊）、文本消息收发、时间戳、气泡左右分栏（自己靠右绿色 `#95ec69`）、按 `senderId` 判定归属、切换会话加载历史并自动滚到底
- **联系人**：好友 / 群聊分组、搜索用户与群组、申请添加（可填申请理由）、头像弹窗详情、一键跳转聊天
- **多账号**：本地记住多个账号并一键切换（localStorage）
- **窗口**：自绘标题栏，支持拖拽、置顶、最小化、最大化、关闭到托盘

### 演示账号

密码统一 `123456`（login mock 实际不校验密码）：

| 邮箱 | 昵称 |
| --- | --- |
| `xiaoming@test.com` | 小明 |
| `xiaohong@test.com` | 小红 |
| `demo@test.com` | 演示用户 |

### 运行与打包

```bash
npm install
npm run dev        # 开发模式（会先 chcp 65001 切 UTF-8 代码页）
```

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式，开调试端口 5858 |
| `npm run build` | 编译三进程到 `out/` |
| `npm start` | 预览已构建产物 |
| `npm run build:win` | Windows 打包（nsis） |
| `npm run build:mac` | macOS 打包（dmg） |
| `npm run build:linux` | Linux 打包（AppImage / snap / deb） |
| `npm run lint` / `format` | ESLint / Prettier |

### 注意事项

- **`npm run dev` 的 `chcp 65001` 是 Windows 专用**，macOS / Linux 上需直接跑 `electron-vite dev`
- **打包配置有两套且不一致**：`package.json` 的 `build` 段（productName `EasyChat`、输出 `installPackages`）与 `electron-builder.yml`（productName `qingliao`、输出 `dist`）。npm 脚本带 `--config`，实际生效的是 **yml**
- **数据不持久**：聊天记录与新增联系人存在内存 `reactive` 里，刷新即丢；只有账号列表与当前用户走 localStorage
- **依赖外部网络**：随机动物头像调用 `dog.ceo` / `thecatapi.com` / `loremflickr.com`；`index.html` 外链 unpkg 的 Element Plus CSS 与 bootcdn 的 Font Awesome，离线环境 UI 可能异常
- **路由导入大小写不匹配**（如路由写 `search.vue`、文件是 `Search.vue`），Windows / macOS 能跑，Linux / CI 会解析失败
- `contextIsolation: false` + `sandbox: false` 属于教学 / 演示级配置，生产环境不建议
- `.npmrc` 里只配了 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`——国内加速 Electron 二进制下载，**`npm install` 超时基本靠它**

---

## 03-ecom-admin — 电商后台管理系统

基于 Element Plus 的后台管理系统，包含登录鉴权、数据看板、商品与用户管理，全部数据由 mockjs 在前端内存中模拟。

### 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Vue | 3.5 | 核心框架 |
| Vue Router | 5.1 | 路由（hash 模式） |
| Pinia | 3.0 | 状态管理 |
| Element Plus | 2.14 | UI 组件（按需自动导入） |
| ECharts | 6.1 | 图表 |
| Axios | 1.16 | HTTP 请求 |
| Mockjs | 1.1 | 接口模拟 |
| Vite | 8.0 | 构建 / 开发服务器 |

### 页面与路由

| 路径 | 页面 | 功能 |
| --- | --- | --- |
| `/login` | 登录 | 账号密码登录，成功后写入 token 与菜单 |
| `/` → `/home` | 主布局 | 左侧菜单 + 顶部导航 + 标签页 + 内容区 |
| `/home` | 数据看板 | 个人信息卡、6 个统计卡片、折线图 / 柱状图 / 饼图 |
| `/mall` | 商品管理 | 完整 CRUD：搜索、新增、编辑、删除、分页 |
| `/user` | 用户管理 | 完整 CRUD：搜索、新增、编辑、删除、分页 |
| `/page1` `/page2` | 占位页 | 仅渲染一张卡片 |

### 核心功能

- **布局**：左侧可折叠菜单（180px ↔ 64px）、顶部面包屑（由 `route.matched` 动态生成）、多标签页导航（首页标签不可关闭，关闭后自动跳相邻标签）
- **数据看板**：ECharts 折线图（各品牌订单量）、柱状图（新增 / 活跃用户）、饼图（视频数据），用 `ResizeObserver` 响应式重绘
- **商品管理**：搜索、新增 / 编辑共用弹窗表单（名称、价格、5 类分类、库存、上下架状态），删除二次确认
- **用户管理**：搜索、弹窗表单（姓名、年龄 1-120、性别、出生日期、地址），删除二次确认

### 登录账号

```
用户名：admin
密码：123456
```

（写死在 `src/api/mockData/permission.js`，非真实后端校验）

### 数据来源

所有接口由 mockjs 劫持 XHR 模拟，共 12 个接口（首页图表 3 个、商品 CRUD 4 个、用户 CRUD 3 个、登录鉴权 1 个、首页用户列表 1 个），数据在模块加载时生成（用户 200 条、商品 50 条），**刷新页面即重置**——不存在真正的持久化。

### 运行

```bash
npm install
npm run dev        # http://localhost:5173
```

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | Vite 开发服务器 |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 预览构建产物 |

### 注意事项

- **没有路由守卫**，未登录也能直接访问 `/home` 等页面
- `config/index.js` 里的 `mock` 开关与 `request.js` 里的 `isMock` 实际未被使用（mockjs 是全局劫持 XHR 生效），属残留代码
- 登录返回的权限菜单存进了 store，但侧边栏用的是组件内硬编码菜单，动态权限未真正接通
- `@types/echarts` 是冗余依赖（ECharts 6 已自带类型）

---

## 通用说明

三个项目均未提交 `node_modules/`、`dist/`、`out/` 等依赖与构建产物，克隆后需各自 `npm install`。

```bash
cd 01-yueyin       # 或 02-qingliao / 03-ecom-admin
npm install
npm run dev
```
