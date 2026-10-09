
<template>
  <div class="login-pannel">
    <div class="title drag">轻聊</div>
    <div class="login-form">
      <div class="error-msg">{{ errorMsg }}</div>
      <el-form :model="formData" ref="formDataRef" label-width="0px" @submit.prevent>
        <el-form-item prop="email">
          <el-input size="large" clearable placeholder="请输入邮箱" maxLength="30" v-model.trim="formData.email">
            <template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="nickName" v-if="!isLogin">
          <el-input size="large" clearable placeholder="请输入昵称" maxLength="15" v-model.trim="formData.nickName">
            <template #prefix>
              <span class="iconfont icon-user"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input show-password size="large" clearable placeholder="请输入密码" v-model.trim="formData.password">
            <template #prefix>
              <span class="iconfont icon-lock"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="repassword" v-if="!isLogin">
          <el-input show-password size="large" clearable placeholder="请再次输入密码" v-model.trim="formData.repassword">
            <template #prefix>
              <span class="iconfont icon-lock"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="checkcode">
          <div class="check-code-panel">
            <el-input size="large" clearable placeholder="请输入验证码" v-model.trim="formData.checkcode">
              <template #prefix>
                <span class="iconfont icon-safe"></span>
              </template>
            </el-input>
            <div class="code-box" @click="getVerifyCode">
              {{ verifyCodeText || '点击获取' }}
            </div>
          </div>
        </el-form-item>
        <el-button type="primary" class="login-btn" @click="submit">{{ isLogin ? '登录' : '注册' }}</el-button>
        <div class="bottom-link">
          <span class="a-link" @click="changeOptype">{{ isLogin ? '没有账号？' : '已有账号？' }}</span>
        </div>
      </el-form>
    </div>
  </div>
  <win-op :showSetTop="false" :showMin="false" :showMax="false" :closeType="0"></win-op>
</template>
<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Utils from '@/utils/utils.js'
import Verify from '@/utils/verify.js'
import request from '../utils/Request'
import api from '../utils/Api'
import md5 from 'js-md5'
import { useUserInfoStore } from '../stores/UserinfoStore'
import { useRouter } from 'vue-router'
import WinOp from '../components/WinOp.vue'
// 初始化表单字段
const formData = ref({
  email: '',
  nickName: '',
  password: '',
  repassword: '',
  checkcode: ''
})
const formDataRef = ref()
const isLogin = ref(true)
const errorMsg = ref(null)
const verifyCodeText = ref('')
const verifyCodeKey = ref('')
const UserinfoStore = useUserInfoStore()
const router = useRouter()
// 获取验证码
const getVerifyCode = async () => {
  CleanVerify()
  formData.value.checkcode = ''
  try {
    let res = await request({ url: api.checkCode, params: {}, showLoading: false })
    verifyCodeText.value = res.data.code
    verifyCodeKey.value = res.data.codeKey
    localStorage.setItem('checkCodeKey', res.data.codeKey)
    console.log('验证码加载成功', res.data)
  } catch (err) {
    console.error('获取验证码失败', err)
    errorMsg.value = '验证码加载失败，请点击刷新'
  }
}
// 切换登录/注册
const changeOptype = () => {
  window.ipcRenderer.send('loginOrRegister', !isLogin.value)
  isLogin.value = !isLogin.value
  nextTick(() => {
    formDataRef.value.resetFields()
    formData.value = {
      email: '',
      nickName: '',
      password: '',
      repassword: '',
      checkcode: ''
    }
    CleanVerify()
    getVerifyCode()
  })
}
// 表单提交
const submit = async () => {
  CleanVerify()
  if (!checkValue('checkEmail', formData.value.email, '请输入正确的邮箱')) return
  if (!isLogin.value && !checkValue(null, formData.value.nickName, '请输入昵称')) return
  if (!checkValue('checkPassword', formData.value.password, '密码只能是数字、字母、特殊字符,8-18位')) return
  if (!isLogin.value && formData.value.password !== formData.value.repassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  if (!checkValue(null, formData.value.checkcode, '请输入验证码')) return
  // 验证码比对（忽略大小写）
  if (formData.value.checkcode.toLowerCase() !== verifyCodeText.value.toLowerCase()) {
    errorMsg.value = '验证码错误，请重新输入'
    formData.value.checkcode = ''
    getVerifyCode()
    return
  }
  let result = await request({
    url: isLogin.value ? api.login : api.register,
    params: {
      email: formData.value.email,
      password: isLogin.value ? md5(formData.value.password) : formData.value.password,
      checkCode: formData.value.checkcode,
      nickName: formData.value.nickName,
      checkCodeKey: localStorage.getItem('checkCodeKey')
    },
    errorCallback: (response) => {
      getVerifyCode()
      errorMsg.value = response.info
    }
  })
  if (!result) return
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  if (isLogin.value) {
    UserinfoStore.setInfo(result.data)
    window.ipcRenderer.send('openChat', {
      email: formData.value.email,
      userId: result.data.userId,
      nickName: result.data.nickName,
      admin: result.data.admin,
      screenWidth: screenWidth,
      screenHeight: screenHeight
    })
    router.push('/main')
  } else {
    ElMessage.success('注册成功')
    changeOptype()
  }
}
// 校验工具
const checkValue = (type, value, msg) => {
  if (Utils.isEmpty(value)) {
    errorMsg.value = msg
    return false
  }
  if (type && !Verify[type](value)) {
    errorMsg.value = msg
    return false
  }
  return true
}
const CleanVerify = () => {
  errorMsg.value = null
}
onMounted(() => {
  getVerifyCode()
})
</script>

<style lang="scss" scoped>
.email-select {
  width: 250px;
}
.loading-panel {
  height: calc(100vh - 32px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  img {
    width: 300px;
  }
}
.login-pannel {
  background: #fff;
  border-radius: 3px;
  border: 1px solid #ddd;
  .title {
    height: 30px;
    padding: 5px 0 0 10px;
  }
  .login-form {
    padding: 0 15px 29px 15px;
    :deep(.el-input__wrapper) {
      box-shadow: none;
    }
    .el-form-item {
      border-bottom: 1px solid #ddd;
      margin-bottom: 12px !important;
    }
  }
  .email-panel {
    align-items: center;
    width: 100%;
    display: flex;
    .input {
      flex: 1;
    }
    .icon-down {
      margin-left: 3px;
      width: 16px;
      cursor: pointer;
      border: none;
    }
  }
  .error-msg {
    line-height: 30px;
    min-height: 30px;
    color: #fb7373;
    padding-left: 8px;
    margin-bottom: 8px;   
  }
  .check-code-panel {
    display: flex;
    align-items: center; 
    .check-code {
      cursor: pointer;
      width: 120px;
      height: 40px; 
      margin-left: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
  }
  .login-btn {
    margin-top: 20px;
    width: 100%;
    background: #07c160;
    height: 36px;
    font-size: 16px;
  }
  .bottom-link {
    text-align: right;
  }
}
.code-box{
  cursor: pointer;
}
</style>