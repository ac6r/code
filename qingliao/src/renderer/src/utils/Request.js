import axios from "axios";
import api from "./Api";

// 创建 axios 实例
const instance = axios.create({
    baseURL: (import.meta.env.PROD ? api.prodDomain : api.devDomain) + "/api",
    timeout: 10 * 1000,
    withCredentials: true,
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject({ showError: true, msg: "网络异常" });
    }
);

// 统一请求封装
export default function request(options) {
    options.method = options.method || "POST";
    let params = options.params || {};

    let formData = new FormData();
    for (let key in params) {
        formData.append(key, params[key] === undefined ? "" : params[key]);
    }

    return instance.post(options.url, formData, {
        showLoading: options.showLoading ?? true,
    });
}