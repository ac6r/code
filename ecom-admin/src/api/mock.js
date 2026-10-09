import Mock from "mockjs"
import homeApi from './mockData/home'
import userApi from './mockData/user'
import menuApi from './mockData/permission'
// 1.拦截的路径 2.方法 3.制造出的假数据
// 使用正则匹配，避免查询参数导致匹配失败
Mock.mock(/\/api\/home\/getTableData/, "get", homeApi.getTableData)
Mock.mock(/\/api\/home\/getCountData/, "get", homeApi.getCountData)
Mock.mock(/\/api\/home\/getChartData/, "get", homeApi.getChartData)
Mock.mock(/\/api\/home\/getUserData/, "get", userApi.getUserList)
Mock.mock(/\/api\/user\/deleteUser/, "get", userApi.deleteUser)
Mock.mock(/\/api\/user\/addUser/, "post", userApi.addUser)
Mock.mock(/\/api\/user\/updateUser/, "post", userApi.updateUser)
Mock.mock(/\/api\/permission\/getMenu/, "post", menuApi.getMenu)
Mock.mock(/\/api\/mall\/getMallData/, "get", homeApi.getMallData)
Mock.mock(/\/api\/mall\/addMall/, "post", homeApi.addMall)
Mock.mock(/\/api\/mall\/updateMall/, "post", homeApi.updateMall)
Mock.mock(/\/api\/mall\/deleteMall/, "get", homeApi.deleteMall)