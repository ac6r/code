// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "默认路径",
            redirect: "/login",
        },
        {
            path: "/login",
            name: "登录",
            component: () => import('@/views/Login.vue'),
        },
        // 一级路由：主页面 Main.vue
        {
            path: "/main",
            name: "主窗口",
            redirect: "/main/chat",
            component: () => import('@/views/Main.vue'),
            children: [
                // 二级路由：聊天
                {
                    path: 'chat',
                    name: "聊天",
                    component: () => import('@/views/chat/Chat.vue'),
                    children: [{
                        path: ':contactId',
                        name: 'GiveMessage',
                        component: () => import('@/views/chat/GiveMessage.vue')
                    }]
                },
                // 二级路由：联系人 Contact.vue（核心嵌套父组件）
                {
                    path: 'contact',
                    name: "联系人",
                    // 重定向到三级子路由 空白页（绝对路径，稳定不报错）
                    redirect: "/main/contact/blank",
                    component: () => import('@/views/contact/Contact.vue'),
                    // 三级子路由：仅相对路径，无 /
                    children: [
                        {
                            path: 'blank',
                            name: "空白页",
                            component: () => import('@/views/contact/BlankPage.vue')
                        },
                        {
                            path: 'search',
                            name: "搜索",
                            component: () => import('@/views/contact/search.vue')
                        },
                        {
                            path: 'creatGroup',
                            name: '新建群聊',
                            component: () => import('@/views/contact/CreatGroup.vue')
                        }
                    ]
                },
                {
                    path: 'setting',
                    name: "设置",
                    redirect: '/main/setting/userinfo',
                    component: () => import('@/views/setting/Setting.vue'),
                    children: [{
                        path: "userinfo",
                        name: "个人信息",
                        component: () => import('@/views/setting/Userinfo.vue'),
                    },
                    {
                        path: "fileMange",
                        name: "文件管理",
                        component: () => import('@/views/setting/FileMange.vue'),
                    },
                    {
                        path: "about",
                        name: "关于",
                        component: () => import('@/views/setting/About.vue'),
                    }
                    ]
                }
            ]
        }
    ]
})

export default router