<template>
  <div class="file-manage">
    <div class="fm-header">
      <div class="fm-title">文件管理</div>
      <div class="fm-sub">
        <span class="fm-dir" :title="dir">{{ dir }}</span>
        <span class="fm-count">共 {{ filteredFiles.length }} 个文件 · 占用 {{ totalSizeText }}</span>
      </div>
    </div>

    <div class="fm-toolbar">
      <el-input v-model="searchKey" clearable placeholder="搜索文件名" class="fm-search">
        <template #prefix>
          <span class="iconfont icon-search"></span>
        </template>
      </el-input>

      <div class="fm-tabs">
        <div
          v-for="tab in categoryTabs"
          :key="tab.value"
          :class="['fm-tab', activeCategory === tab.value ? 'active' : '']"
          @click="activeCategory = tab.value"
        >
          {{ tab.label }}
          <span class="fm-tab-count">{{ countOf(tab.value) }}</span>
        </div>
      </div>

      <div class="fm-tool-actions">
        <el-button :loading="loading" title="刷新" @click="loadFiles">
          <span v-if="!loading" class="iconfont icon-refresh"></span>
        </el-button>
        <el-button type="primary" @click="openDir">
          <span class="iconfont icon-folder"></span>
          <span class="btn-text">打开文件夹</span>
        </el-button>
      </div>
    </div>

    <div class="fm-body">
      <el-table
        :data="filteredFiles"
        v-loading="loading"
        height="100%"
        @row-dblclick="handleOpen"
      >
        <el-table-column label="文件" min-width="240">
          <template #default="{ row }">
            <span class="file-icon" :style="{ background: iconColor(row.category) }">
              <i :class="['iconfont', iconClass(row.category)]"></i>
            </span>
            <span class="file-name" :title="row.name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="修改时间" width="160">
          <template #default="{ row }">{{ formatTime(row.mtime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
            <el-button link type="primary" @click="handleOpen(row)">打开</el-button>
            <el-button link type="primary" @click="handleReveal(row)">位置</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="fm-empty">
            <div class="iconfont icon-folder1"></div>
            <div class="fm-empty-text">
              {{ loadError || (isFiltering ? '没有匹配的文件' : '还没有文件') }}
            </div>
            <el-button v-if="loadError" size="small" type="primary" @click="loadFiles">
              重试
            </el-button>
          </div>
        </template>
      </el-table>
    </div>

    <el-dialog v-model="previewVisible" title="图片预览" width="560px">
      <img v-if="previewUrl" :src="previewUrl" class="preview-img" alt="预览" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const files = ref([])
const dir = ref('')
const loading = ref(false)
const searchKey = ref('')
const activeCategory = ref('all')
const previewVisible = ref(false)
const previewUrl = ref('')
const loadError = ref('')

const categoryTabs = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
  { value: 'doc', label: '文档' },
  { value: 'other', label: '其他' }
]

const CATEGORY_LABEL = {
  all: '全部',
  image: '图片',
  video: '视频',
  audio: '音频',
  doc: '文档',
  other: '其他'
}
const CATEGORY_ICON = {
  image: 'icon-image',
  video: 'icon-video02',
  audio: 'icon-play1',
  doc: 'icon-file',
  other: 'icon-file'
}
const CATEGORY_COLOR = {
  image: '#1485ee',
  video: '#9661bc',
  audio: '#f6903d',
  doc: '#0294f5',
  other: '#65789b'
}

const categoryLabel = (value) => CATEGORY_LABEL[value] || '其他'
const iconClass = (value) => CATEGORY_ICON[value] || 'icon-file'
const iconColor = (value) => CATEGORY_COLOR[value] || '#65789b'

const hasIpc = () => window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function'

const isFiltering = computed(() => !!searchKey.value.trim() || activeCategory.value !== 'all')

const filteredFiles = computed(() => {
  const key = searchKey.value.trim().toLowerCase()
  return files.value.filter((item) => {
    const matchCategory = activeCategory.value === 'all' || item.category === activeCategory.value
    const matchKey = !key || item.name.toLowerCase().includes(key)
    return matchCategory && matchKey
  })
})

const totalSizeText = computed(() =>
  formatSize(filteredFiles.value.reduce((sum, item) => sum + item.size, 0))
)

const countOf = (value) =>
  value === 'all' ? files.value.length : files.value.filter((item) => item.category === value).length

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size >= 100 || index === 0 ? Math.round(size) : size.toFixed(1)} ${units[index]}`
}

function formatTime(ms) {
  if (!ms) return '-'
  const date = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

// 把 IPC 报错翻译成人话：最常见的 “No handler registered”
// 其实是渲染层热更新了、主进程还停留在旧代码，重启应用即可
function friendlyError(err) {
  const msg = String((err && err.message) || err || '')
  if (msg.includes('No handler registered')) {
    return '主进程还没加载文件管理模块（开发模式下渲染层热更新、主进程未重启所致）。请重启应用后点击"重试"。'
  }
  return '读取文件失败：' + msg
}

async function loadFiles() {
  loadError.value = ''
  if (!hasIpc()) {
    loadError.value = '当前环境不支持文件管理（需要在 Electron 中运行）'
    return
  }
  loading.value = true
  try {
    const result = await window.ipcRenderer.invoke('file:list')
    if (result && result.ok) {
      files.value = result.files || []
      dir.value = result.dir || ''
    } else {
      loadError.value = (result && result.message) || '读取文件失败'
    }
  } catch (err) {
    loadError.value = friendlyError(err)
  } finally {
    loading.value = false
  }
}

async function handlePreview(row) {
  if (!hasIpc()) return
  const result = await window.ipcRenderer.invoke('file:preview', row.path)
  if (result && result.ok) {
    previewUrl.value = result.dataUrl
    previewVisible.value = true
  } else {
    ElMessage.info((result && result.message) || '该文件无法预览')
  }
}

async function handleOpen(row) {
  if (!hasIpc()) return
  const result = await window.ipcRenderer.invoke('file:open', row.path)
  if (!result || !result.ok) {
    ElMessage.error((result && result.message) || '打开失败')
  }
}

async function handleReveal(row) {
  if (!hasIpc()) return
  await window.ipcRenderer.invoke('file:reveal', row.path)
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除文件', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch (err) {
    return
  }
  const result = await window.ipcRenderer.invoke('file:delete', row.path)
  if (result && result.ok) {
    ElMessage.success('已删除')
    loadFiles()
  } else {
    ElMessage.error((result && result.message) || '删除失败')
  }
}

async function openDir() {
  if (!hasIpc()) return
  await window.ipcRenderer.invoke('file:openDir')
}

onMounted(loadFiles)
</script>

<style lang="scss" scoped>
.file-manage {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 62px);
  padding: 16px 20px 18px;
  box-sizing: border-box;
  background: #fff;
}

.fm-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  .fm-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2329;
  }

  .fm-sub {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
    font-size: 12px;
    color: #999;
  }

  .fm-dir {
    max-width: 340px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.fm-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;

  .fm-search {
    width: 220px;
    :deep(.iconfont) {
      font-size: 13px;
      color: #999;
    }
  }
}

.fm-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;

  .fm-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 12px;
    border-radius: 15px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: #f2f3f5;
    }

    &.active {
      background: #e8f3ff;
      color: #1485ee;
      font-weight: 500;
    }

    .fm-tab-count {
      font-size: 11px;
      color: #a8abb2;
    }
  }
}

.fm-tool-actions {
  display: flex;
  align-items: center;
  gap: 0;

  .iconfont {
    font-size: 13px;
  }

  .btn-text {
    margin-left: 5px;
  }
}

.fm-body {
  flex: 1;
  min-height: 0;
  margin-top: 4px;

  .file-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 5px;
    margin-right: 10px;
    vertical-align: middle;

    .iconfont {
      font-size: 15px;
      color: #fff;
    }
  }

  .file-name {
    vertical-align: middle;
    color: #1f2329;
  }
}

.fm-empty {
  padding: 30px 0;
  color: #a8abb2;

  .iconfont {
    font-size: 40px;
    margin-bottom: 10px;
  }

  .fm-empty-text {
    max-width: 460px;
    margin: 0 auto 12px;
    line-height: 1.7;
    white-space: normal;
  }
}

.preview-img {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  margin: 0 auto;
}
</style>
