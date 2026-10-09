<template>
  <div class="user-edit-panel">
    <div class="edit-header">
      <span class="back-btn" @click="goBack">
        <i class="iconfont icon-arrow-left"></i> 返回
      </span>
      <h3>编辑个人信息</h3>
    </div>

    <el-form
      :model="formData"
      :rules="rules"
      ref="formRef"
      label-width="80px"
      class="edit-form"
    >
      <el-form-item label="昵称" prop="nickName">
        <el-input v-model="formData.nickName" maxlength="20" show-word-limit />
      </el-form-item>

      <el-form-item label="性别" prop="sex">
        <el-radio-group v-model="formData.sex">
          <el-radio :value="0">女</el-radio>
          <el-radio :value="1">男</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="地区" prop="areaName">
        <el-input v-model="formData.areaName" placeholder="请输入所在地区" />
      </el-form-item>

      <el-form-item label="个性签名" prop="personalSignature">
        <el-input
          type="textarea"
          :rows="3"
          v-model="formData.personalSignature"
          maxlength="100"
          show-word-limit
          placeholder="介绍一下自己吧"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存修改
        </el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '../../utils/Request'
import api from '../../utils/Api.js'

const emit = defineEmits(['back', 'updated'])

const formRef = ref(null)
const saving = ref(false)
const formData = ref({
  nickName: '',
  sex: 1,
  areaName: '',
  personalSignature: ''
})

const rules = {
  nickName: [
    { required: true, message: '昵称不能为空', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  areaName: [
    { max: 50, message: '地区不能超过 50 个字符', trigger: 'blur' }
  ],
  personalSignature: [
    { max: 100, message: '个性签名不能超过 100 个字符', trigger: 'blur' }
  ]
}

// 加载现有用户信息
const loadUserInfo = async () => {
  try {
    const res = await Request({ url: api.getUserInfo, showLoading: false })
    if (res && res.code === 200) {
      formData.value = {
        nickName: res.data.nickName || '',
        sex: res.data.sex ?? 1,
        areaName: res.data.areaName || '',
        personalSignature: res.data.personalSignature || ''
      }
    }
  } catch (err) {
    ElMessage.error('加载用户信息失败')
    console.error(err)
  }
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
    // 模拟保存接口
    const res = await Request({
      url: api.saveUserInfo,  
      params: { ...formData.value }
    })
    if (res && res.code === 200) {
      ElMessage.success('个人信息已更新')
      emit('updated', formData.value)  
      goBack()
    } else {
      ElMessage.error(res?.msg || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败，请重试')
    console.error(err)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  emit('back')
}

onMounted(() => {
  loadUserInfo()
})
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