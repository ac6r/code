
<template>
    <div class="login">
        <el-dialog v-model="isVisible" :width="dialogWidth" :before-close="handleClose">
               <div class="login-wrapper">
                <img src="@assets/img/logo.jpg" alt="" class="login-logo">
                <!-- 登录、注册 切换 -->
                  <div class="mode-tabs">
                    <span :class="{active: mode === 'login'}" @click="switchMode('login')">登录</span>
                    <span :class="{active: mode === 'register'}" @click="switchMode('register')">注册</span>
                  </div>

                  <!-- 登录表单 -->
                   <el-form v-if="mode === 'login'" ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="">
                    <el-form-item prop="phone" label-width="">
                        <el-input v-model="loginForm.phone" placeholder="请输入手机号"></el-input>
                    </el-form-item>
                    <el-form-item prop="pwd" label-width="">
                        <el-input v-model="loginForm.pwd" placeholder="请输入密码" show-password></el-input>
                    </el-form-item>
                   </el-form>

                   <!-- 注册表单 -->
                    <el-form v-if="mode === 'register'" ref="registerFormRef":model="registerForm" :rules="registerFormRules" label-width="" >
                        <el-form-item prop="phone" label-width="">
                            <el-input v-model="registerForm.phone" placeholder="请输入手机号"></el-input>
                        </el-form-item>
                         <el-form-item prop="nickname" label-width="">
                            <el-input v-model="registerForm.nickname" placeholder="请输入昵称"></el-input>
                        </el-form-item> 
                        <el-form-item prop="pwd" label-width="">
                            <el-input v-model="registerForm.pwd" placeholder="请输入密码" show-password></el-input>
                        </el-form-item> 
                        <el-form-item prop="captcha" label-width="">
                            <el-input v-model="registerForm.captcha" placeholder="请输入验证码"></el-input>
                        </el-form-item>

                        <!-- 验证码 -->
                         <div class="captcha-display" @click="refreshCaptcha">
                            <span class="captcha-label">验证码:</span>
                            <span class="captcha-code">{{ currentCaptcha }}</span>
                            <span class="captcha-hint">(点击刷新)</span>
                         </div>
                    </el-form>
               </div>
               <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ mode === 'login' ? '登录' : '注册' }}</el-button>
                </span>
               </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { getCurrentInstance,onMounted,computed,ref,reactive, onUnmounted,toRefs} from 'vue';
import {usePlayerStore} from "@/stores/player"
import { getLocalUsers ,saveLocalUser, findLocalUser, buildLocalUserInfo} from '@/mock/user';

const {proxy} = getCurrentInstance() 
const store = usePlayerStore()
const isVisible = ref(true)
const windowWidth = ref(window.innerWidth)
const mode = ref('login')
const currentCaptcha = ref('')

const dialogWidth = computed(() => {
    if(windowWidth.value < 768) return '90%'
    if(windowWidth.value <= 1024) return '50%'
    return '30%'
})

//登录表单
const formInfo = reactive ({
    loginForm: { phone: '', pwd: '' },
    loginFormRules: {
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        pwd: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }
})
const { loginForm, loginFormRules } = toRefs(formInfo)

//注册表单
const registerInfo = reactive ({
    registerForm: { phone: '', pwd: '', captcha: '', nickname: '' },
    registerFormRules: {
        phone: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
        ],
        nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
        pwd: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 6, message: '密码至少6位', trigger: 'blur' }
        ],
        captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
    }
})
const { registerForm, registerFormRules } = toRefs(registerInfo)

//登录成功后设置用户状态
const setLoginSuccess = (profile, token='',cookie= '') => {
    window.localStorage.setItem('isLogin',true)
    window.localStorage.setItem('userInfo' ,JSON.stringify(profile))
    if(token)window.localStorage.setItem('token',token)
    if(cookie)window.localStorage.setItem('cookie',cookie)
    store.setLogin(true)
    store.setUserInfo(profile)
    store.setLoginDialog(false)
}

//登录提交
const loginSubmit = async () => {
    return new Promise((resolve) => {
        proxy.$refs.loginFormRef.validate(async (valid) => {
            if(!valid) {resolve(false); return}

            const {phone, pwd} = formInfo.loginForm

            //1.先查本地用户
            const localUser = findLocalUser(phone, pwd)
            if(localUser) {
                setLoginSuccess(buildLocalUserInfo(localUser))
                proxy.$msg.success('登录成功（本地账号）')
                resolve(true)
                return
            }
            // 2. 尝试网易云 API 登录
            try {
                const { data: res } = await proxy.$http.login({ phone, pwd })
                if (res.code === 200) {
                    const { data: info } = await proxy.$http.getUserInfo({ uid: res.profile.userId })
                    if (info.code === 200) {
                        setLoginSuccess(info.profile, res.token, res.cookie)
                    } else {
                        setLoginSuccess(res.profile, res.token, res.cookie)
                    }
                    proxy.$msg.success('登录成功')
                    resolve(true)
                } else {
                    proxy.$msg.error(res.msg || '登录失败，请检查账号密码')
                    resolve(false)
                }
            } catch {
                proxy.$msg.error('登录失败，请检查账号密码')
                resolve(false)
            }
        })
    })
}

//注册提交
const registerSubmit = async () => {
    return new Promise((resolve) =>{
        proxy.$refs.registerFormRef.validate(async(valid) => {
            if(!valid){ resolve(false); return}
            
            const {phone, pwd, captcha, nickname} = registerInfo.registerForm

            // 验证码校验
            if (captcha !== currentCaptcha.value) {
                proxy.$msg.error('验证码错误，请重新输入')
                refreshCaptcha()
                resolve(false)
                return
            }

             // 检查手机号是否已注册
            const localUsers = getLocalUsers()
            if (localUsers.find(u => u.phone === phone)) {
                proxy.$msg.error('该手机号已注册，请直接登录')
                resolve(false)
                return
            }
               //本地注册
               const newUser = {
                userId:'local_' + Date.now(),
                phone,
                password:pwd,
                nickname,
                createdAt:new  Date().toISOString()
               }
               saveLocalUser(newUser)

               //自动登录
               setLoginSuccess(buildLocalUserInfo(newUser))
               proxy.$msg.success('注册成功, 已自己登录')
               resolve(true)
        })
    })
}

const submitForm = () => {
    if (mode.value === 'login') {
        loginSubmit()
    }else{
        registerSubmit()
    }
}

//生成随机四位验证码
const generateCaptcha = () => {
    currentCaptcha.value = String(Math.floor(1000 + Math.random() * 9000))
}
generateCaptcha()

const refreshCaptcha = () => {
    generateCaptcha()
}

const onResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', onResize)
})

const handleClose = () => store.setLoginDialog(false)
const switchMode = (m) => {
    mode.value = m
    generateCaptcha()
}

</script>

<style scoped lang="less">
.login-logo {
    display: block;
    margin: 0 auto 30px;
}

.mode-tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 25px;
    border-bottom: 1px solid #eee;

    span {
        flex: 1;
        text-align: center;
        padding: 12px 0;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;

        &.active {
            color: #ff641e;
            border-bottom-color: #ff641e;
            font-weight: bold;
        }

        &:hover {
            color: #ff641e;
        }
    }
}

.captcha-display {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0;
    cursor: pointer;
    user-select: none;

    .captcha-label {
        font-size: 13px;
        color: #666;
    }

    .captcha-code {
        font-size: 22px;
        font-weight: bold;
        letter-spacing: 6px;
        color: #ff641e;
        background: #fff5f0;
        padding: 4px 12px;
        border-radius: 4px;
        margin: 0 10px;
        font-style: italic;
        border: 1px dashed #ff641e;
    }

    .captcha-hint {
        font-size: 11px;
        color: #bbb;
    }
}

.login {

    :deep(.el-dialog__body) {
        padding: 30px 20px 0;
    }

    .dialog-footer {
        position: relative;
        z-index: 2;
        display: block;
        width: 100%;
        margin-bottom: 120px;

        .el-button {
            width: 100%;
        }
    }

    :deep(.el-dialog__footer) {
        position: relative;

        &:after {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            content: "";
            width: 100%;
            height: 100%;
            opacity: .3;
            background: url('@assets/img/login_bg2.jpg') center bottom no-repeat;
            background-size: contain;
        }
    }
}
</style>
