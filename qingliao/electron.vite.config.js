import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      viteMockServe({
        // 1. 手动指定要加载的mock文件（必须写，electron-vite下默认不扫描）
        include: ['/mock/account.js'],
        // 2. 明确mock文件的目录
        mockPath: resolve('src/renderer/src/mock'),
        // 3. 开启本地mock
        localEnabled: true,
        // 4. 打包时关闭mock
        prodEnabled: false,
        // 5. 开启日志，方便看mock是否生效
        logger: true,
        // 6. 支持js文件
        supportTs: false,
      })
    ]
  }
})