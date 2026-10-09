<template>
    <div class="banner">
        <el-skeleton :loading="loading" animated>
            <template #template>
                <el-skeleton class="skeleton-img"variant="image"/>
                <el-skeleton class="skeleton-img"variant="image"/>
                <el-skeleton class="skeleton-img"variant="image"/>
                <el-skeleton class="skeleton-img"variant="image"/>
            </template>
            <template #default>
               <swiper 
               :slides-per-view="slidesPerView"
               :space-between="spaceBetween"
               :modules="modules"
               :autoplay="{delay:3000}"
               :pagination="{clickable:true}"
               v-if="list"
               ref="mySwiper"
               class="banner_wrap"
               >
               <swiper-slide
               v-for="item of list"
               :key="item.imageUrl"   
               >
               <el-image :src="item.imageUrl" :alt="item.typeTitle" class="banner_img" @click="pathHandler(item)">
                  <template #placeholder>
                    <div class="image-slot">
                        <i class="iconfont icon-placeholder"></i>
                    </div>
                  </template>
               </el-image>
               </swiper-slide>
               </swiper>
            </template>
        </el-skeleton>
    </div>
</template>

<script setup>
import { getCurrentInstance,onMounted,onUnmounted,ref,computed } from 'vue';
import { useRouter } from 'vue-router';

 import 'swiper/css'
 import 'swiper/css/pagination'
 import { Navigation, Pagination, Autoplay } from 'swiper/modules'
 import { Swiper, SwiperSlide } from 'swiper/vue'

 const {proxy} = getCurrentInstance()
 const router = useRouter()

   let list = ref([])
    let loading = ref(true)
    let windowWidth = ref(window.innerWidth)
    const onResize = () =>{
        windowWidth.value = window.innerWidth
    }

    onMounted(()=>{
        window.addEventListener('resize',onResize)
    })

    onUnmounted(()=>{
        window.removeEventListener('resize',onResize)
    })

    const slidesPerView = computed(()=>{
        if(windowWidth.value < 768) return 1
        if(windowWidth.value <= 1024) return 2
        return 4
    })

    const spaceBetween = computed(() =>{
        if(windowWidth.value < 768) return 0
        if(windowWidth.value<= 1024) return 15
        return 30
    })
 
     const getBanner = async() =>{
        try {
            const {data:res} = await proxy.$http.getBanner()

            if(res.code != 200){
                return proxy.$msg.error('数据请求失败')
            }
            list.value = res.banners
            loading.value = false
        }catch(error){
            console.log(error)
        }
     }

     const pathHandler = (params) =>{
         switch (params.targetType) {
        case 1: // 单曲
            router.push({ path: '/song', query: { id: params.targetId } })
            break
        case 10: // 专辑
            router.push({ path: '/album', query: { id: params.targetId } })
            break
        case 1000: // 歌单
            router.push({ path: '/playlist', query: { id: params.targetId } })
            break
        case 1004: // MV
            router.push({ path: '/mvlist/mv', query: { id: params.targetId } })
            break
        case 3000: // 外链
            window.open(params.url, '_blank')
            break
     }
    }
    const modules = [Navigation,Pagination,Autoplay]

    onMounted(()=>{
        getBanner()
    })
</script>


<style lang="less" scoped>
// 轮播图的宽度
@w: calc((@mainWidth - 90px) / 4);

.banner {
    padding-bottom: 30px;
}
.banner_wrap {
    position: relative;
    padding: 40px 0;
    .calcHeight(@w, 1080, 400);
    font-size: 0;

    .banner_img {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .swiper-slide, .el-image {
        .calcHeight(@w, 1080, 400);
    }
}

.el-skeleton {
    display: flex;
    justify-content: space-between;
    padding: 40px 0;

    .skeleton-img {
        flex: 1;
        .calcHeight(@w, 1080, 400);
        margin-right: 30px;

        &:last-child {
            margin: 0;
        }
    }
}
.swiper {
    // opacity: .1;

    .swiper-slide {
        border-radius: 12px;
        box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
        overflow: hidden;
    }
    :deep(.swiper-pagination-bullet-active) {
        width: 15px;
        border-radius: 4px;
        background: var(--color-text-height);
    }
}

/* 平板端 */
.respond-tablet({
    .banner_wrap {
        padding: 20px 0;
    }
});

/* 移动端 */
.respond-mobile({
    .banner {
        padding-bottom: 15px;
    }
    .banner_wrap {
        padding: 15px 0;
        height: auto;
        aspect-ratio: 16/9;
    }
    .banner_wrap .swiper-slide,
    .banner_wrap .el-image {
        height: auto;
    }
    .banner_img {
        aspect-ratio: 16/9;
    }
    .el-skeleton {
        padding: 15px 0;
        .skeleton-img {
            margin-right: 10px;
        }
    }
});
</style>
