<template>
    <div class="progress" @click.stop="point" @touchstart="touchPoint" ref="progress">
         <div class="progress-line"></div>
         <div class="progress-bg" :style="{width:progressWidth}">
            <div class="progress-btn" @mousedown.self.stop="move()" @touchstart.self.stop.prevent="touchMove()" v-if="isShowBtn"></div>
         </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    progressWidth:{
        type:String,
        dafault:'0'
    },
    isShowBtn:{
        type:Boolean,
        default:true
    }
})

const emit = defineEmits(['setProgressLine'])
const progress = ref(null)

//获取元素到浏览器左侧距离
const getOffsetLeft = (obj) => {
    let oLeft = obj.offsetLeft
    let oParent = obj.offsetLeft

    while (oParent !== null) {
        oLeft += oParent.offsetLeft
        oParent = oParent.offsetLeft
    }

    return oLeft
}

const setProgressLine = (e, flag = true) => {
    const $progress = progress.value
    const clientX = e.clientX
     //  实时获取横坐标，若是超过进度条最大宽度，则值为进度条的宽度
     const curProgress = clientX - getOffsetLeft($progress) >=  $progress.offseetWidth ? $progress.offseetWidth : (clientX - getOffsetLeft($progress) <= 0 ? 0 : clientX - getOffsetLeft($progress))

     emit('setProgressLine',{val : curProgress/$progress.offseetWidth, flag:flag})
}

//进度条拖拽(鼠标)
const move = () => {
    document.onmousemove = (e) => {
        setProgressLine(e,false)
    }

    // 拖拽进度条的时候 禁止页面文字选中
    document.body.onselectstart = function() {return false}

    document.onmouseup = function(e) {
        setProgressLine(e)
        document.onmousemove = document.onmouseup = document.body.onselectstart = null
     }

     return false
}

//进度条拖拽(触摸)
const touchMove = () => {
    document.ontouchmove = (e) => {
        setProgressLine(e.touches[0],false)
    }
    document.ontouchend = function (e) {
        setProgressLine(e.changedTouches[0])
        document.ontouchmove = document.ontouchend = null
}
        return false
}

//点击音频进度条
const point = (e) => {
    setProgressLine(e)
}

// 触摸点击音频进度条
const touchPoint = (e) => {
    setProgressLine(e.touches[0])
}
</script>

<style scoped lang="less">
.progress {
    position: relative;
    width: 100%;
    height: 4px;
    padding: 4px 0;
    border-radius: 2px;
    cursor: pointer;

    .progress-line {
        position: absolute;
        top: 4px;
        left: 0;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: #eee;
        box-shadow:0 0 4px #efefef inset;
    }

    .progress-bg {
        position: absolute;
        top: 4px;
        left: 0;
        width: 0;
        height: 4px;
        border-radius: 2px;
        background: -moz-linear-gradient(left, #ff641e 0%, rgba(255, 150, 0, 0.77) 10%, rgba(255, 100, 30, 0.8) 50%, #ff641e 70%, #ff7832 100%);
        /* FF3.6-15 */
        background: -webkit-linear-gradient(left, #ff641e 0%, rgba(255, 150, 0, 0.77) 10%, rgba(255, 100, 30, 0.8) 50%, #ff641e 70%, #ff7832 100%);
        /* Chrome10-25,Safari5.1-6 */
        background: linear-gradient(to right, #ff641e 0%, rgba(255, 150, 0, 0.77) 10%, rgba(255, 100, 30, 0.8) 50%, #ff641e 70%, #ff7832 100%);
        /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
        filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#ff7832', GradientType=1);
        /* IE6-9 */
    }

    .progress-btn {
        position: absolute;
        right: -6px;
        width: 4px;
        height: 4px;
        border: 4px solid var(--color-text-height);
        top: -4.5px;
        background: #fff;
        box-shadow: 0 0 15px 0 rgba(0,0,0,.15);
        transition: all .3s;
        border-radius: 50%;
        cursor: grab;
    }
}
</style>