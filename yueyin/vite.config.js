import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    css: {
        preprocessorOptions: {
            less: {
                additionalData: `@import (reference) "${resolve('src/assets/less/main.less')}"; @import (reference) "${resolve('src/assets/less/responsive.less')}";`,
                javascriptEnabled: true,
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@components': resolve(__dirname, 'src/components'),
            '@apis': resolve(__dirname, 'src/apis'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@plugins': resolve(__dirname, 'src/plugins'),
            '@assets': resolve(__dirname, 'src/assets'),
            '@views': resolve(__dirname, 'src/views'),
        }
    },
    server: {
        port: 9999,
        host: '0.0.0.0',
        https: false,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        }
    },
    // vite preview 只认 preview.proxy，不读上面的 server.proxy。
    // 不配这里的话，构建产物预览时 /api 会 404，页面同样是空白。
    preview: {
        port: 9999,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        }
    }
})
