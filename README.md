# code

前端项目集合，收录三个练习 / 面试项目，按数字前缀排序。

| 目录 | 项目 | 技术栈 | 说明 |
| --- | --- | --- | --- |
| [`01-yueyin/`](./01-yueyin) | 悦音音乐 | Vue 3 · Vite · Element Plus · Pinia · Swiper · NeteaseCloudMusicApi | 音乐播放器，本地 mock 服务提供数据 |
| [`02-qingliao/`](./02-qingliao) | 轻聊 EasyChat | Electron · Vue 3 · electron-vite · electron-builder | 桌面端聊天应用 |
| [`03-ecom-admin/`](./03-ecom-admin) | 电商后台管理 | Vue 3 · Vite · Element Plus · Pinia · Vue Router · ECharts · Mock.js | 后台管理系统，数据用 Mock.js 模拟 |

## 快速开始

每个项目相互独立，各自安装依赖：

```bash
cd 01-yueyin   # 或 02-qingliao / 03-ecom-admin
npm install
npm run dev
```

各项目具体命令见其目录下的 `README.md` 与 `package.json` 的 `scripts`。

> 仓库中未包含 `node_modules/`、`dist/`、`out/` 等依赖与构建产物，克隆后需自行 `npm install`。

## 说明

- `01-yueyin/` 的音乐数据由 `01-yueyin/server/` 下的本地服务提供，先启动服务再启动前端。
- `02-qingliao/` 打包产物输出到 `installPackages/`。
- 目录前的 `01-` / `02-` / `03-` 前缀仅用于控制展示顺序，不含其他含义。
