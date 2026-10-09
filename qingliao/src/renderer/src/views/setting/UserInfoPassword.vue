<template>
  <div class="user-edit-panel">
    <div class="edit-header">
      <span class="back-btn" @click="goBack">
        <i class="iconfont icon-arrow-left"></i> 返回
      </span>
      <h3>修改密码</h3>
    </div>

    <el-form
      :model="formData"
      :rules="rules"
      ref="formRef"
      label-width="100px"
      class="edit-form"
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
          v-model="formData.oldPassword"
          type="password"
          show-password
          placeholder="请输入旧密码"
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
        />
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">
          修改密码
        </el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '../../utils/Request'
import api from '../../utils/Api.js'

const emit = defineEmits(['back'])

const formRef = ref(null)
const saving = ref(false)

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateNewPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    if (formData.confirmPassword !== '') {
      // 如果确认密码已填，触发确认密码校验
      formRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== formData.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const res = await Request({
      url: api.updatePassword,
      params: {
        password: formData.oldPassword,
        newPassword: formData.newPassword
      }
    })
    if (res && res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      // 密码修改后一般需要重新登录，这里直接跳转登录页
      emit('back')
      // 也可在父组件中监听该事件并执行 router.push('/login')
    } else {
      ElMessage.error(res?.msg || '密码修改失败')
    }
  } catch (err) {
    ElMessage.error('请求失败，请重试')
    console.error(err)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  emit('back')
}
</script>

<style lang="scss" scoped>
.user-edit-panel {
  padding: 20px 24px;
  height: 100%;
  overflow-y: auto;
}

.edit-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;

  .back-btn {
    cursor: pointer;
    color: #409eff;
    font-size: 14px;
    margin-right: 16px;
    &:hover {
      color: #66b1ff;
    }
  }

  h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.edit-form {
  max-width: 480px;
  margin: 0 auto;
}
</style>