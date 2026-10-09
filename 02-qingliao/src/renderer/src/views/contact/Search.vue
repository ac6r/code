<template>
<ContentPanel>
<div class="search-form">
<el-input
clearable
placeholder="请输入用户Id或群组Id"
v-model="contactId"
size="large"
@keydown.enter="search"
></el-input>
<div class="search-btn iconfont icon-search"@click="search"></div>
</div>
<div v-if="searchResult && Object.keys(searchResult).length > 0" class="search-result-panel">
<div class="search-result">
<span class="contact-type">{{ contactTypeName }}</span>
<UserBaseInfo
:userInfo="searchResult"
:showArea="searchResult.contactId != userInfoStore.getInfo().userId"
>
</UserBaseInfo>
</div>
<div class="op-btn" v-if="searchResult.contactId != userInfoStore.getInfo().userId">
<el-button
type="primary"
v-if="
searchResult.status == null ||
searchResult.status == 0 ||
searchResult.status == 2 ||
searchResult.status == 3 ||
searchResult.status == 4
"
@click="applyContact"
>
{{ searchResult.contactType == 'USER' ? '添加到联系人' : '申请加入群组' }}
</el-button>
<el-button type="primary" v-if="searchResult.status == 1" @click="sendMessage">
发消息
</el-button>
<span v-if="searchResult.status == 5 || searchResult.status == 6">对方拉黑了你</span>
</div>
</div>
<div v-if="!searchResult && searchLoaded" class="no-data">没有搜索到任何结果</div>
</ContentPanel>
<SearchAdd ref="searchAddRef" @reload="reseForm" @success="handleApplySuccess"></SearchAdd>
</template>
<script setup>
import ContentPanel from '../../components/ContentPanel.vue';
import { ref, computed, onMounted, onUnmounted,getCurrentInstance } from 'vue';
import { useUserInfoStore } from '@/stores/UserinfoStore.js';
import { useRoute,useRouter } from 'vue-router'; //：导入路由，用来接收参数
import api from '@/utils/Api.js';
import request from '@/utils/Request.js';
import { ElMessage } from 'element-plus';
import UserBaseInfo from '../../components/UserBaseInfo.vue';
import SearchAdd from './SearchAdd.vue';
const {proxy} = getCurrentInstance()
const userInfoStore = useUserInfoStore()
const route = useRoute() 
const router = useRouter()
const searchResult = ref(null)
const contactId = ref('')
const searchLoaded = ref(false)
const isMounted = ref(false)
onMounted(() => {
isMounted.value = true
// 接收左侧传过来的固定用户信息
if (route.query.userInfo) {
  try {
    const user = JSON.parse(route.query.userInfo)
    searchResult.value = user
  } catch (e) {
    console.error('解析用户信息失败', e)
  }
}
})
onUnmounted(() => {
isMounted.value = false
})
// 类型计算
const contactTypeName = computed(()=>{
if(!searchResult.value) return ''
if(userInfoStore.getInfo().userId === searchResult.value.contactId){
return '自己'
}
if(searchResult.value.contactType == 'USER'){
return '用户'
}
if(searchResult.value.contactType == 'GROUP'){
return '群组'
}
return ''
})
// 搜索方法
const search = async()=>{
if(!contactId.value){
ElMessage.warning('请输入用户Id或群组Id')
return
}
searchLoaded.value = false
try {
let result = await request({
url: api.search,
params:{
contactId : contactId.value.trim()
}
})
if(!isMounted.value) return
if(result.code === 200) {
searchResult.value = result.data;
} else {
searchResult.value = null;
}
searchLoaded.value = true
} catch (err) {
if(!isMounted.value) return
ElMessage.error('搜索失败，请重试')
console.error('搜索异常：', err)
}
}
const searchAddRef = ref()
const applyContact = () => {
  searchAddRef.value.show(searchResult.value);
}
const handleApplySuccess = () => {
  const text = searchResult.value.contactType === 'USER' ? '添加联系人' : '申请入群';
  ElMessage.success(`${text}请求已发送`);
  if (searchResult.value) {
    searchResult.value.status = 2;
  }
 const type = searchResult.value.contactType;
  window.dispatchEvent(new CustomEvent('refresh-contact-list', {
    detail: type === 'USER' ? 'USER' : 'GROUP'
  }));
}
const sendMessage = () => {
 const contactId = searchResult.value?.contactId
 if(contactId){
      router.push(`/main/chat/${contactId}`) 
 }else{
       ElMessage.warning('无法获取联系人Id')
 }
}
</script>
<style lang="scss" scoped>
.search-form {
padding-top: 50px;
display: flex;
align-items: center;
:deep(.el-input__wrapper) {
border-radius: 4px 0px 0px 4px;
border-right: none;
}
}
.search-btn {
background: #07c160;
color: #fff;
line-height: 40px;
width: 80px;
text-align: center;
border-radius: 0px 5px 5px 0px;
cursor: pointer;
&:hover {
background: #0dd36c;
}
}
.no-data {
padding: 30px 0px;
text-align: center;
color: #999;
}
.search-result-panel {
.search-result {
padding: 30px 20px 20px 20px;
background: #fff;
border-radius: 5px;
margin-top: 10px;
position: relative;
.contact-type {
position: absolute;
left: 0px;
top: 0px;
background: #2cb6fe;
padding: 2px 5px;
color: #fff;
border-radius: 5px 0px 0px 0px;
font-size: 12px;
}
}
.op-btn {
border-radius: 5px;
margin-top: 10px;
padding: 10px;
background: #fff;
text-align: center;
}
}
</style>