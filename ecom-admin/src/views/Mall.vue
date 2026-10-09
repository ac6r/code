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
const dialogTitle = ref('新增商品')
const isEdit = ref(false)

const formData = reactive({
  id: '',
  name: '',
  price: '',
  category: '',
  stock: '',
  status: 1
})

const tableLabel = reactive([
  { prop: 'name', label: '商品名称' },
  { prop: 'price', label: '价格(¥)', width: '120' },
  { prop: 'category', label: '分类', width: '120' },
  { prop: 'stock', label: '库存', width: '100' },
  { prop: 'statusLabel', label: '状态', width: '100' }
])

const categories = ['电子产品', '服装', '食品', '家居', '图书']

const getMallData = async () => {
  const data = await proxy.$api.getMallData({
    name: config.name,
    page: config.page,
    limit: config.limit
  })
  tableData.value = data.list.map(item => ({
    ...item,
    statusLabel: item.status === 1 ? '上架' : '下架'
  }))
  config.total = data.count
}

const handleSearch = () => {
  config.name = formInline.keyWord
  config.page = 1
  getMallData()
}

const handleChange = (page) => {
  config.page = page
  getMallData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增商品'
  Object.assign(formData, { id: '', name: '', price: '', category: '', stock: '', status: 1 })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑商品'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name || !formData.price || !formData.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    await proxy.$api.updateMall(formData)
    ElMessage.success('编辑成功')
  } else {
    await proxy.$api.addMall(formData)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getMallData()
}

const handleDelete = async (val) => {
  try {
    await ElMessageBox.confirm("确定要删除该商品吗？")
    await proxy.$api.deleteMall({ id: val.id })
    ElMessage.success('删除成功')
    config.page = 1
    getMallData()
  } catch (err) {
    if (err === 'cancel') {
      ElMessage.info("已取消删除")
    }
  }
}

onMounted(() => {
  getMallData()
})
</script>

<template>
  <div class="top-header">
    <div class="first">
      <el-button type="primary" @click="handleAdd">新增</el-button>
      <el-form :inline="true" :model="formInline">
        <el-form-item label="请输入">
          <el-input placeholder="请输入商品名称" v-model="formInline.keyWord"></el-input>
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
        <el-form-item label="商品名称" required>
          <el-input v-model="formData.name" placeholder="请输入商品名称"></el-input>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="formData.price" :min="0" :precision="2" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="formData.stock" :min="0" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
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
  padding: 20px 20px 0 20px;
}
.table {
  padding: 0 20px;
}
</style>