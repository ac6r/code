<template>
   <div class="user-avatar"
    @click="showDetailHeader($event)"
   :style="{width:width + 'px',height:width +'px','border-radius':borderRadius + 'px'}">
   <ShowLocalImage
    :width="width"
    :fileId="userId"
     partType="avatar"
     :forceGet="true"
   ></ShowLocalImage>
   </div>
</template>
<script setup>
import ShowLocalImage from './ShowLocalImage.vue';
import { ref,reactive,getCurrentInstance } from 'vue';
const {proxy} = getCurrentInstance()
const props = defineProps({ 
  userId: {
    type: String,
  },
  width: {
    type: Number,
    default: 40
  },
      borderRadius:{
      type:Number,
      default:0
  },
  showDetail: {
    type: Boolean,
    default: false
  },
  // 新增：用户信息，用来传给弹窗
  userInfo: {
    type: Object,
    default: () => ({})
  }
})
// 新增：定义emit事件
const emit = defineEmits(['show-detail'])

const showDetailHeader = (event) =>{
    if(props.showDetail){
        // 阻止事件冒泡，避免触发父元素的跳转事件，防止页面空白
        event.stopPropagation();
        // 触发父组件的弹窗事件，把用户信息传过去
        emit('show-detail', props.userInfo)
    }
}
</script>
<style lang="scss" scoped>
.user-avatar {
    background: #d3d3d3;
    display: flex;
    overflow: hidden;
    cursor: pointer;
    align-items: center;
    justify-content: center;
}
</style>