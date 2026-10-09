import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router/index.js'
import "@/assets/assets/cust-elementplus.scss"
import "@/assets/assets/icon/iconfont.css"
import "./assets/assets/base.scss"
import utils from './utils/utils.js'
import verify from './utils/verify.js'
import request from './utils/Request.js'
import message from './utils/message.js'
import * as Pinia from 'pinia'
import "./mock/account.js"
import Layout from './components/Layout.vue'
import WinOp from './components/WinOp.vue'
import ContentPanel from './components/ContentPanel.vue'
import mockjs from 'mockjs'
import ShowLocalImage from './components/ShowLocalImage.vue'
import UserBaseInfo from './components/UserBaseInfo.vue'
import Dialog from './components/Dialog.vue'
import Avatar from './components/Avatar.vue'
import AvatarBase from './components/AvatarBase.vue'
// import api from './utils/Api.js'


const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(Pinia.createPinia())
app.component("Layout", Layout)
app.component("WinOp", WinOp)
app.component("ContentPanel", ContentPanel)
app.component("ShowLocalImage", ShowLocalImage)
app.component("UserBaseInfo", UserBaseInfo)
app.component("Dialog", Dialog)
app.component("Avatar", Avatar)
app.component("AvatarBase", AvatarBase)

app.config.globalProperties.utils = utils
app.config.globalProperties.verify = verify
app.config.globalProperties.request = request
app.config.globalProperties.message = message
// app.config.globalProperties.api = api
app.mount('#app')
