<script setup>
import { ElMessageBox, ElMessage } from 'element-plus'
import { ref, getCurrentInstance, onMounted, reactive } from 'vue'

const tableData = ref([])
const { proxy } = getCurrentInstance()

const formInline = reactive({ keyWord: '' })
const config = reactive({
  name: '',
  total: 0,
  page: 1,
  limit: 10
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)

const formData = reactive({
  id: '',
  name: '',
  age: '',
  sex: 1,
  birth: '',
  adress: ''
})

const tableLabel = reactive([
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄' },
  { prop: 'sexLabel', label: '性别' },
  { prop: 'birth', label: '出生', width: '200' },
  { prop: 'adress', label: '地址', width: '400' }
])

const getUserData = async () => {
  const data = await proxy.$api.getUserData({
    name: config.name,
    page: config.page,
    limit: config.limit
  })
  tableData.value = data.list.map(item => ({
    ...item,
    sexLabel: item.sex === 1 ? '男' : '女'
  }))
  config.total = data.count
}

const handleSearch = () => {
  config.name = formInline.keyWord
  config.page = 1
  getUserData()
}

const handleChange = (page) => {
  config.page = page
  getUserData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  Object.assign(formData, { id: '', name: '', age: '', sex: 1, birth: '', adress: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name) {
    ElMessage.warning('请填写姓名')
    return
  }
  if (isEdit.value) {
    await proxy.$api.updateUser(formData)
    ElMessage.success('编辑成功')
  } else {
    await proxy.$api.addUser(formData)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getUserData()
}

const handleDelete = async (val) => {
  try {
    await ElMessageBox.confirm("确定要删除吗？")
    await proxy.$api.deleteUser({ id: val.id })
    ElMessage({ showClose: true, message: '删除成功', type: 'success' })
    config.page = 1
    getUserData()
  } catch (err) {
    if (err === 'cancel') {
      ElMessage.info("已取消删除")
    }
  }
}

onMounted(() => {
  getUserData()
})
</script>

<template>
  <div class="top-header">
    <div class="first">
      <el-button type="primary" @click="handleAdd">新增</el-button>
      <el-form :inline="true" :model="formInline">
        <el-form-item label="请输入">
          <el-input placeholder="请输入用户名" v-model="formInline.keyWord"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table">
      <el-table :data="tableData" style="width: 100%">
        <el-table-column
          v-for="item in tableLabel"
          :key="item.prop"
          :width="item.width ? item.width : 125"
          :prop="item.prop"
          :label="item.label"
        />
        <el-table-column fixed="right" label="Operations" min-width="160">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="prev, pager, next"
        size="small"
        :total="config.total"
        :current-page="config.page"
        @current-change="handleChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="formData.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="formData.age" :min="1" :max="120" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.sex">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="formData.birth" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="formData.adress" placeholder="请输入地址"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.first {
  display: flex;
  justify-content: space-between;
}
</style>