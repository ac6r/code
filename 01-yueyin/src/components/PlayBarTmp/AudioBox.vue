<template>
    <audio 
       v-if="curSongInfo"
       ref="myAudio"
       preload="auto"
       @canplay="canplaySong"
       @playing="playSong"
       @ended="endedSong"
       @error="errorSong"
       @timeupdate="updateSongTime"
       :src="curSongInfo.url"
    />
</template>

<script setup>
import { reactive,nextTick,computed,ref,watch,toRefs } from 'vue';
import {usePlayerStore} from "@/stores/player"

const store = usePlayerStore()
const emit = defineEmits(['setCurrentTime'])
const myAudio = ref(null)
const info = reactive ({
    initAudioReady:false, //初始化音频准备
    playMode:0   // 播放模式  0循环播放、1单曲循环、2随机播放
})

//获取播放列表
const playIndex = computed(() => store.playIndex)
const playList = computed(() => store.playList)
const isPlayed = computed(() => store.isPlayed)

//获取当前播放歌曲信息
const curSongInfo = computed(() => playList.value[playIndex.value])

//手动切换歌曲
const changeSong = (type) => {
    if(playList.value.length !== 1) {
        let index = playIndex.value
        if(info['playMode'] === 2) {
            index = Math.floor(Math.random() * playList.value.length - 1) + 1
        }else {
            if(type === 'prev') {
                index = index ===0 ? playList.value.length - 1 : --index
            }else {
                index = index >= playList.value.length - 1 ? 0 : ++index 
            }
        }

        info['initAudioReady'] = false
        store.SET_PLAYSTATUS(false)
        store.SET_PLAYINDEX(index)
    } else {
        loopsong()
    }
}

//单曲循环
const loopsong = () => {
    const $myAudio = myAudio.value

    $myAudio.currentTime = 0
    $myAudio.play()
    store.SET_PLAYSTATUS(true)
}

//音乐 播放、暂停、上一首、下一首
const playAudioType = (type) => {
    if(type === 'play') {
        store.SET_PLAYSTATUS(!isPlayed.value)
        store.SET_PLAYINDEX(playIndex.value)
    } else {
        changeSong(type)
    }
}

//播放模式：随机、循环、单曲
const playAudioMode = (type) => {
    info['playMode'] = type
}

//音量禁音及取消操作
const setVolumeHandler = (volume) =>{
    const $myAudio = myAudio.value
        $myAudio.muted = volume
}

const setvolumeProgress = (val) => {
    const $myAudio = myAudio.value
    $myAudio.volume = val
    $myAudio.muted = val ? 0 : 1

}

//点击拖拽进度条，设置当前时间
const setAudioProgress = (t) => {
        const $myAudio = myAudio.value
        $myAudio.currentTime = t
}

//解决刷新页面的时候，音频准备就绪
const canplaySong = () => {
    info['initAudioReady'] =  true
}

//音频播放时候 初始化状态，获取音频总时长
const playSong = () => {
    info['initAudioReady'] = true
    store.SET_PLAYSTATUS(true)
}

//音频播放结束 自动播放下一首
const endedSong = () => {
    if(info['playMode'] === 1) { 
        loopsong()
    } else {
        changeSong('next')
    }
}

//监视音频时间，实时更新当前播放时间
const updateSongTime = (e) => {
    if(!info.initAudioReady) {
        return
    } 
    emit ('setCurrentTime', e.target.currentTime)
}

watch(curSongInfo, (newSong, oldSong) => {
    if(!newSong || (oldSong && newSong.id === oldSong.id)) {
        return
    }

    //当前播放歌曲变化时候 重置状态及当前播放时长
    info['initAudioReady'] = false
    info['currentTine'] = 0
    emit('setCurrentTime', 0)

    nextTick(() => {
        const $myAudio = myAudio.value

        if($myAudio) {
            $myAudio.play()
        }
    })
}, {deep:true})

watch(() => isPlayed.value, (playing) => {
    // 等待音频加载成功完成后播放
    if (!info.initAudioReady) {
        return
    }

    nextTick(() => {
        const $myAudio = myAudio.value

        if ($myAudio) {
            playing ? $myAudio.play() : $myAudio.pause()
        }
    })
})
const { initAudioReady, playMode } = toRefs(info)

defineExpose({
    playAudioType,
    playAudioMode,
    setVolumeHandler,
    setvolumeProgress,
    setAudioProgress,
})
</script>

<style scoped >
</style>