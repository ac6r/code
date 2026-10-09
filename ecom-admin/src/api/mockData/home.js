import Mock from 'mockjs'
// src/api/mockData/home.js

// ==================== Mall 商品管理 Mock 数据 ====================
const mallList = []
const mallCount = 50
for (let i = 0; i < mallCount; i++) {
    mallList.push(
        Mock.mock({
            id: Mock.Random.guid(),
            name: Mock.Random.ctitle(3, 8),
            price: Mock.Random.float(10, 9999, 2, 2),
            category: Mock.Random.pick(['电子产品', '服装', '食品', '家居', '图书']),
            stock: Mock.Random.integer(0, 500),
            status: Mock.Random.integer(0, 1)
        })
    )
}

function param2obj(url) {
    const search = url.split('?')[1]
    if (!search) {
        return {}
    }
    return JSON.parse(
        '{"' +
        decodeURIComponent(search)
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
        '"}'
    )
}

const mallApi = {
    getMallData: (config) => {
        const { name, page = 1, limit = 10 } = param2obj(config.url)
        const mockList = mallList.filter(item => {
            if (name && item.name.indexOf(name) === -1) return false
            return true
        })
        const pageList = mockList.filter((item, index) => index < limit * page && index >= limit * (page - 1))
        return {
            code: 200,
            data: {
                list: pageList,
                count: mockList.length,
            }
        }
    },
    addMall: (config) => {
        const item = JSON.parse(config.body)
        item.id = Mock.Random.guid()
        mallList.unshift(item)
        return { code: 200, data: null, msg: '新增成功' }
    },
    updateMall: (config) => {
        const item = JSON.parse(config.body)
        const index = mallList.findIndex(m => m.id === item.id)
        if (index !== -1) {
            mallList[index] = { ...mallList[index], ...item }
        }
        return { code: 200, data: null, msg: '编辑成功' }
    },
    deleteMall: (config) => {
        const { id } = param2obj(config.url)
        const index = mallList.findIndex(m => m.id === id)
        if (index !== -1) {
            mallList.splice(index, 1)
        }
        return { code: 200, data: null, msg: '删除成功' }
    }
}

export default {
    ...mallApi,
    getTableData: () => {
        return {
            code: 200,
            data: {
                tableData: [
                    {
                        name: "oppo",
                        todayBuy: 500,
                        monthBuy: 3500,
                        totalBuy: 22000,
                    },
                    {
                        name: "vivo",
                        todayBuy: 300,
                        monthBuy: 2000,
                        totalBuy: 15000,
                    },
                    {
                        name: "xiaomi",
                        todayBuy: 400,
                        monthBuy: 3000,
                        totalBuy: 18000,
                    },
                    {
                        name: "huawei",
                        todayBuy: 600,
                        monthBuy: 4000,
                        totalBuy: 25000,
                    }
                ]
            }
        }
    },
    getCountData: () => {
        return {
            code: 200,
            data: [
                {
                    name: "今日支付订单",
                    value: 1234,
                    icon: "SuccessFilled",
                    color: "#2ec7c9"
                },
                {
                    name: "今日收藏订单",
                    value: 210,
                    icon: "StarFilled",
                    color: "#ffb980"
                },
                {
                    name: "今日未支付订单",
                    value: 1234,
                    icon: "GoodsFilled",
                    color: "#5ab1ef"
                },
                {
                    name: "本月支付订单",
                    value: 1234,
                    icon: "SuccessFilled",
                    color: "#2ec7c9"
                },
                {
                    name: "本月收藏订单",
                    value: 210,
                    icon: "StarFilled",
                    color: "#ffb980"
                },
                {
                    name: "本月未支付订单",
                    value: 1234,
                    icon: "GoodsFilled",
                    color: "#5ab1ef"
                }
            ]
        }
    },

    getChartData: () => {
        return {
            code: 200,
            data: {
                orderData: {
                    date: [
                        "2019-10-01",
                        "2019-10-02",
                        "2019-10-03",
                        "2019-10-04",
                        "2019-10-05",
                        "2019-10-06",
                        "2019-10-07"
                    ],
                    data: [
                        {
                            苹果: 3839,
                            小米: 1423,
                            华为: 4965,
                            oppo: 3334,
                            vivo: 2820,
                            一加: 4751
                        },
                        {
                            苹果: 3560,
                            小米: 2099,
                            华为: 3192,
                            oppo: 4210,
                            vivo: 1283,
                            一加: 1613
                        },
                        {
                            苹果: 1864,
                            小米: 4598,
                            华为: 4202,
                            oppo: 4377,
                            vivo: 4123,
                            一加: 4750
                        },
                        {
                            苹果: 2634,
                            小米: 1458,
                            华为: 4155,
                            oppo: 2847,
                            vivo: 2551,
                            一加: 1733
                        },
                        {
                            苹果: 3622,
                            小米: 3990,
                            华为: 2860,
                            oppo: 3870,
                            vivo: 1852,
                            一加: 1712
                        },
                        {
                            苹果: 2004,
                            小米: 1864,
                            华为: 1395,
                            oppo: 1315,
                            vivo: 4051,
                            一加: 2293
                        },
                        {
                            苹果: 3797,
                            小米: 3936,
                            华为: 3642,
                            oppo: 4408,
                            vivo: 3374,
                            一加: 3874
                        }
                    ]
                },
                videoData: [
                    { name: "小米", value: 2999 },
                    { name: "苹果", value: 5999 },
                    { name: "vivo", value: 1500 },
                    { name: "oppo", value: 1999 },
                    { name: "魅族", value: 2200 },
                    { name: "三星", value: 4500 }
                ],
                userData: [
                    { date: "周一", new: 5, active: 200 },
                    { date: "周二", new: 10, active: 500 },
                    { date: "周三", new: 12, active: 550 },
                    { date: "周四", new: 60, active: 800 },
                    { date: "周五", new: 65, active: 550 },
                    { date: "周六", new: 53, active: 770 },
                    { date: "周日", new: 33, active: 170 }
                ]
            }
        }
    }
}