import request from "./request";
// 请求首页左侧的数据
export default {
    getTableData() {
        return request({
            url: "/home/getTableData",
            method: "get",
        })
    },
    getCountData() {
        return request({
            url: "/home/getCountData",
            method: "get",
        })
    },
    getChartData() {
        return request({
            url: "/home/getChartData",
            method: "get",
        })
    },
    getUserData(data) {
        return request({
            url: "/home/getUserData",
            method: "get",
            params: data
        })
    },
    deleteUser(data) {
        return request({
            url: "/user/deleteUser",
            method: "get",
            params: data
        })
    },
    addUser(data) {
        return request({
            url: "/user/addUser",
            method: "post",
            data: data
        })
    },
    updateUser(data) {
        return request({
            url: "/user/updateUser",
            method: "post",
            data: data
        })
    },
    getMenu(params) {
        return request({
            url: '/permission/getMenu',
            method: 'post',
            data: params
        })
    },
    getMallData(data) {
        return request({
            url: "/mall/getMallData",
            method: "get",
            params: data
        })
    },
    addMall(data) {
        return request({
            url: "/mall/addMall",
            method: "post",
            data: data
        })
    },
    updateMall(data) {
        return request({
            url: "/mall/updateMall",
            method: "post",
            data: data
        })
    },
    deleteMall(data) {
        return request({
            url: "/mall/deleteMall",
            method: "get",
            params: data
        })
    }
}
