import { ref, computed, onMounted, onUnmounted } from "vue";
export function useMobile() {
    const width = ref(window.innerWidth)

    const onResize = () => {
        width.value = window.innerWidth
    }

    onMounted(() => {
        window.addEventListener('resize', onResize)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', onResize)
    })

    const isMobile = computed(() => width.value < 768)
    const isTablet = computed(() => width.value >= 768 && width.value <= 1024)
    const isDesktop = computed(() => width.value > 1024)


    return {
        width,
        isMobile,
        isTablet,
        isDesktop
    }
}

