<template>
        <div class="tabs">
         <el-tag
         v-for="(tag,index) in tags"
         :key="tag.name"
         :closable="tag.name !== 'home'"
         :effect="route.name === tag.name ? 'dark' : 'plain'"
         @click="handleMenu(tag)"
         @close="handleClose(tag,index)"
         >
       {{ tag.label}}
         </el-tag>
        </div>
</template>


<script setup>
import { computed, ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import { useAllDataStore } from '../store';
const store = useAllDataStore()
const tags = computed(()=>store.state.tags)
const route = useRoute()
const router = useRouter()
const handleMenu = (tag)=>{
    router.push(tag.name)
    store.selectMenu(tag)
}
const handleClose = (tag,index) =>{
    store.updateTags(tag)
    if(tag.name !== route.name) return
    if(index === store.state.tags.length){
        store.selectMenu(tags.value[index-1])
        router.push(tags.value[index-1].name)
    }else{
        store.selectMenu(tags.value[index])
        router.push(tags.value[index].name)
    }
}
</script>

<style>
.tags{
    margin: 20px 0 0 20px;
}
.el-tag{
    margin-right: 10px;
}

</style>