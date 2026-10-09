import axios from "axios";
import { ElMessage } from "element-plus";
import config from "../config";
const NETWORK_ERROR = '网络错误';
const service = axios.create({
    baseURL: config.baseApi
})
// 请求拦截器
service.interceptors.request.use(function (config) {
    return config;
}, function (error) {
    ElMessage.error(NETWORK_ERROR)
    return Promise.reject(error);
});
// 【修复】补全响应错误回调
service.interceptors.response.use((res) => {
    const { code, data, msg } = res.data
    if (code === 200) {
        return data;
    } else {
        ElMessage.error(msg || NETWORK_ERROR)
        return Promise.reject(msg || NETWORK_ERROR)
    }
}, (err) => {
    ElMessage.error(NETWORK_ERROR)
    return Promise.reject(err)
})
function request(options) {
    options.method = options.method || "get"
    // 删除：get自动赋值params的代码
    let isMock = config.mock
    if (typeof options.mock !== "undefined") {
        isMock = options.mock
    }
    // 移除动态修改defaults.baseURL
    return service(options)
}
export default request