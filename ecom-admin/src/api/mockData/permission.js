import Mock from 'mockjs'
export default {
    getMenu(config) {
        if (!config.body) {
            return {
                code: -999,
                msg: '请求参数不能为空',
                data: null
            }
        }
        let userInfo
        try {
            userInfo = JSON.parse(config.body)
        } catch (err) {
            // json格式错误捕获
            return { code: -999, msg: '参数格式错误', data: null }
        }
        const { username, password } = userInfo

        // 账号密码校验逻辑
        if (username === 'admin' && password === '123456') {
            return {
                code: 200,
                msg: '登录成功',
                data: {
                    token: Mock.Random.guid(), // 随机生成token
                    menu: [
                        { path: '/', name: 'home', label: '首页', icon: 's-home', url: 'Home/index' },
                        { path: '/user', name: 'user', label: '用户管理', icon: 'user', url: 'User/index' },
                        {
                            path: '/goods', name: 'goods', label: '商品管理', icon: 'goods',
                            children: [
                                { path: '/goods/list', label: '商品列表', url: 'Goods/List' },
                                { path: '/goods/category', label: '商品分类', url: 'Goods/Category' }
                            ]
                        }
                    ]
                }
            }
        } else {
            // 账号密码错误
            return {
                code: -1,
                msg: '用户名或密码错误',
                data: null
            }
        }
    }
}