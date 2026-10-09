<script setup>
import { reactive,getCurrentInstance } from 'vue';
import { useAllDataStore } from '../store';
import { useRouter } from 'vue-router';
const loginForm = reactive({
    username:'',
    password:''
})
const router = useRouter()
const store = useAllDataStore()
const {proxy} = getCurrentInstance()
const handleLogin = async()=>{
  try {
    const res = await proxy.$api.getMenu(loginForm)
    console.log(res)
    store.updateMenuList(res.menu)
    store.state.token=res.token
    router.push('/home')
  } catch (err) {
    console.log('接口请求失败',err)
  }
}
</script>

<template>
    <div class="body-login">
    <el-form :model="loginForm" class="login-container">
     <h1>欢迎登入</h1>
     <el-form-item>
        <el-input type="input" placeholder="请输入账号" v-model="loginForm.username">
        </el-input>
     </el-form-item>
     <el-form-item>
        <el-input type="password" placeholder="请输入密码" v-model="loginForm.password" show-password>
        </el-input>
     </el-form-item>
     <el-form-item>
        <el-button type="primary" @click="handleLogin" class="loginer"> 
            登入
        </el-button>
     </el-form-item>
    </el-form>
    </div>

</template>


<style scoped>
.body-login{
    width: 100%;
    height: 100%;
    box-sizing: 100%;
    overflow: hidden;
    background-image: url("../assets/img/touxiang.png");
}
.login-container{
    width: 350px;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 15px;
    padding: 35px 35px 15px 35px;
    box-shadow: 0 0 25px #cacaca;
    margin: 250px auto;
    h1{
        text-align: center;
        margin-top: 20px;
        color: #505;
    }
    :deep(.el-form-item__content){
        justify-content: space-around;
    }
}

</style>