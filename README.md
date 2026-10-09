# code

前端项目集合，收录三个练习 / 面试项目。

| 目录 | 项目 | 技术栈 | 说明 |
| --- | --- | --- | --- |
| [`ecom-admin/`](./ecom-admin) | 电商后台管理 | Vue 3 · Vite · Element Plus · Pinia · Vue Router · ECharts · Mock.js | 后台管理系统，数据用 Mock.js 模拟 |
| [`qingliao/`](./qingliao) | 轻聊 EasyChat | Electron · Vue 3 · electron-vite · electron-builder | 桌面端聊天应用 |
| [`yueyin/`](./yueyin) | 悦音音乐 | Vue 3 · Vite · Element Plus · Pinia · Swiper · NeteaseCloudMusicApi | 音乐播放器，本地 mock 服务提供数据 |

## 快速开始

每个项目相互独立，各自安装依赖：

```bash
cd ecom-admin   # 或 qingliao / yueyin
npm install
npm run dev
```

各项目具体命令见其目录下的 `README.md` 与 `package.json` 的 `scripts`。

> 仓库中未包含 `node_modules/`、`dist/`、`out/` 等依赖与构建产物，克隆后需自行 `npm install`。

## 说明

- `yueyin/` 的音乐数据由 `yueyin/server/` 下的本地服务提供，先启动服务再启动前端。
- `qingliao/` 打包产物输出到 `installPackages/`。
