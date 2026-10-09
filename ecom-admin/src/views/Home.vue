<script setup>
import { ref,reactive, getCurrentInstance, onMounted } from 'vue'
import * as echarts from 'echarts'
const { proxy } = getCurrentInstance()
const echart = ref(null)
const userEchart = ref(null)
const videoEchart = ref(null)
const observer = ref(null)
const getImageUrl = (name) => {
  return new URL(`../assets/img/${name}.png`, import.meta.url).href
}

const tableData = ref([])
const CountData = ref([])
const chartData = ref([])
const tableLabel = ref({
  name: '课程',
  todayBuy: '今日购买',
  monthBuy: '本月购买',
  totalBuy: '总购买',
})
const xOptions = reactive({
  // 图例文字颜色
  textStyle: {
    color: "#333"
  },
  legend: {},
  grid: {
    left: "20%"
  },
  // 提示框
  tooltip: {
    trigger: "axis"
  },
  xAxis: {
    type: "category", // 类目轴
    data: [],
    axisLine: {
      lineStyle: {
        color: "#17b3a3"
      }
    },
    axisLabel: {
      interval: 0,
      color: "#333"
    }
  },
  yAxis: [
    {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#17b3a3"
        }
      }
    }
  ],
  color: ["#2ec7c9", "#b6a2de", "#5ab1ef", "#ffb980", "#d87a80", "#8d98b3"],
  series: []
})

// 饼图配置
const pieOptions = reactive({
  tooltip: {
    trigger: "item"
  },
  legend: {},
  color: [
    "#0f78f4",
    "#dd536b",
    "#9462e5",
    "#a6a6a6",
    "#e1bb22",
    "#39c362",
    "#3ed1cf"
  ],
  series: []
})
const getTableData = async () => {
  const data = await proxy.$api.getTableData()
  tableData.value = data.tableData
}

const getCountData = async () => {
  const data = await proxy.$api.getCountData()
  CountData.value = data
}
const getChartData = async () => {
  const{orderData,userData,videoData} = await proxy.$api.getChartData()
  xOptions.xAxis.data = orderData.date
  xOptions.series = Object.keys(orderData.data[0]).map(val=>{
    return {
      name:val,
      data:orderData.data.map(item => item[val]),
      type:'line'
    }
  })
  const oneEchart = echarts.init(echart.value)
  oneEchart.setOption(xOptions)
  xOptions.xAxis.data = userData.map(item=>item.date)
xOptions.series = [
  {
    name:'新增用户',
    data:userData.map(item=>item.new),
    type:'bar'
  },
  {
    name:'活跃用户',
    data:userData.map(item=>item.active),
    type:'bar'
  }, 
 ]
 const twoEchart = echarts.init(userEchart.value)
  twoEchart.setOption(xOptions)
  pieOptions.series = [
    {
      data:videoData,
      type:'pie'
    }
  ]
  const threeEchart = echarts.init(videoEchart.value)
  threeEchart.setOption(pieOptions)
  // 监听页面变化
observer.value = new ResizeObserver((en)=>{
  oneEchart.resize()
  twoEchart.resize()
  threeEchart.resize()

})
  // 容器存在
  if(echart.value){
    observer.value.observe(echart.value)
  }
}

onMounted(() => {
  getTableData()
  getCountData()
  getChartData()
})
</script>

<template>
  <div class="home">
    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :span="8" style="margin-top: 20px">
        <el-card shadow="hover" class="user-card">
          <div class="user">
            <img :src="getImageUrl('touxiang')" />
            <div class="user-info">
              <p class="use-info-admin">Admin</p>
              <p class="use-info-p">超级管理员</p>
            </div>
          </div>
          <div class="login-info">
            <p>上次登录时间:<span>2024-06-30</span></p>
            <p>上次登录地点:<span>北京</span></p>
          </div>
        </el-card>

        <!-- 表格（视频里是在个人信息下方） -->
        <el-card shadow="hover" class="use-table" style="margin-top: 20px">
          <el-table :data="tableData">
            <el-table-column
              v-for="(val, key) in tableLabel"
              :key="key"
              :prop="key"
              :label="val"
            />
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：统计卡片，分两行，每行3个 -->
      <el-col :span="16" style="margin-top: 20px">
        <div class="count-list">
          <div class="count-row">
            <el-card
              shadow="hover"
              v-for="(item, index) in CountData.slice(0, 3)"
              :key="item.name"
              class="count-card"
            >
              <div class="count-item">
                <component
                  :is="item.icon"
                  class="icons"
                  :style="{ background: item.color }"
                />
                <div class="detail">
                  <p class="num">¥{{ item.value }}</p>
                  <p class="txt">{{ item.name }}</p>
                </div>
              </div>
            </el-card>
          </div>
          <div class="count-row" style="margin-top: 20px">
            <el-card
              shadow="hover"
              v-for="(item, index) in CountData.slice(3, 6)"
              :key="item.name"
              class="count-card"
            >
              <div class="count-item">
                <component
                  :is="item.icon"
                  class="icons"
                  :style="{ background: item.color }"
                />
                <div class="detail">
                  <p class="num">¥{{ item.value }}</p>
                  <p class="txt">{{ item.name }}</p>
                </div>
              </div>
            </el-card>
          </div>
        </div>
          <el-card class="top-echart">
            <div ref="echart" style="height:280px"></div>
          </el-card>
          <div class="graph">
            <el-card>
              <div ref="userEchart" style="height:240px"></div>
            </el-card>
             <el-card>
              <div ref="videoEchart" style="height:240px"></div>
            </el-card>
          </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home {
  min-height: 100%;
  background-color: #f5f7fa;
  padding: 10px;
}

/* 左侧用户卡片 */
.user-card {
  margin-bottom: 0;
}

.user {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
}

.user-info p {
  line-height: 32px;
  margin: 0;
}

.use-info-admin {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.use-info-p {
  color: #909399;
  font-size: 14px;
}

.login-info p {
  line-height: 28px;
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.login-info span {
  color: #303133;
  margin-left: 10px;
}

/* 右侧统计卡片布局 */
.count-list {
  display: flex;
  flex-direction: column;
}

.count-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.count-card {
  flex: 1;
  min-width: 0;
}

.count-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.icons {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 16px;
}

.detail .num {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.detail .txt {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

/* 表格卡片 */
.use-table {
  margin-top: 20px;
}

.top-echart {
  margin-top: 20px;
}

.graph {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.graph .el-card {
  flex: 1;
}
</style>