import Mock from "mockjs";

// ===================== 多账号模拟 =====================
const DEMO_ACCOUNTS = [
  {
    email: 'xiaoming@test.com',
    userId: 'u_fixed1',
    nickName: '小明',
    sex: 1,
    areaName: '北京 朝阳',
    joinType: 0,
    personalSignature: '好好学习，天天向上',
    avatar: 'https://robohash.org/u_fixed1?set=set4',
    password: '123456',
    token: 'MOCK-TOKEN-XIAOMING'
  },
  {
    email: 'xiaohong@test.com',
    userId: 'u_fixed2',
    nickName: '小红',
    sex: 0,
    areaName: '上海 浦东',
    joinType: 0,
    personalSignature: '生活就像骑自行车，想保持平衡就得往前走',
    avatar: 'https://robohash.org/u_fixed2?set=set4',
    password: '123456',
    token: 'MOCK-TOKEN-XIAOHONG'
  },
  {
    email: 'demo@test.com',
    userId: 'u_demo',
    nickName: '演示用户',
    sex: 1,
    areaName: '广东 深圳',
    joinType: 0,
    personalSignature: '代码改变世界',
    avatar: '',
    password: '123456',
    token: 'MOCK-TOKEN-DEMO'
  }
]

// 辅助函数：根据邮箱查找账号
function findAccountByEmail(email) {
  return DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === (email || '').toLowerCase())
}

// 辅助函数：构建用户信息返回（去除密码）
function buildUserInfo(account) {
  const { password, ...userInfo } = account
  return userInfo
}

// 验证码接口
Mock.mock("/api/account/checkCode", "post", () => {
    return {
        code: 200,
        data: {
            code: Mock.Random.natural(1000, 9999).toString(),
            codeKey: Mock.Random.string(16)
        },
        msg: "获取验证码成功",
    };
});

// 登录接口 — 支持多账号
Mock.mock("/api/account/login", "post", (options) => {
    let email = ''
    try {
      if (options.body instanceof FormData) {
        email = options.body.get('email') || ''
      } else if (typeof options.body === 'string') {
        const params = JSON.parse(options.body)
        email = params.email || ''
      } else if (typeof options.body === 'object' && options.body !== null) {
        email = options.body.email || ''
      }
    } catch (e) {
      // fallback
    }

    const account = findAccountByEmail(email)
    if (account) {
      return {
        code: 200,
        data: buildUserInfo(account),
        msg: "登录成功",
      }
    }
    // 未匹配到则返回第一个演示账号（兼容旧行为）
    return {
      code: 200,
      data: buildUserInfo(DEMO_ACCOUNTS[0]),
      msg: "登录成功（默认账号）",
    }
});

// 注册接口 — 动态添加账号
Mock.mock("/api/account/register", "post", (options) => {
    let email = '', nickName = ''
    try {
      if (options.body instanceof FormData) {
        email = options.body.get('email') || ''
        nickName = options.body.get('nickName') || ''
      } else if (typeof options.body === 'string') {
        const params = JSON.parse(options.body)
        email = params.email || ''
        nickName = params.nickName || ''
      } else if (typeof options.body === 'object' && options.body !== null) {
        email = options.body.email || ''
        nickName = options.body.nickName || ''
      }
    } catch (e) { /* fallback */ }

    const exists = findAccountByEmail(email)
    if (exists) {
      return { code: 400, data: null, msg: "该邮箱已注册" }
    }

    const newAccount = {
      email: email,
      userId: 'u_' + Mock.Random.natural(100000, 999999),
      nickName: nickName || Mock.Random.cname(),
      sex: Mock.Random.natural(0, 1),
      areaName: Mock.Random.province() + ' ' + Mock.Random.city(),
      joinType: 0,
      personalSignature: '这个人很懒，什么都没留下',
      avatar: '',
      password: '123456',
      token: 'MOCK-TOKEN-' + Mock.Random.string(8)
    }
    DEMO_ACCOUNTS.push(newAccount)

    return {
        code: 200,
        data: buildUserInfo(newAccount),
        msg: "注册成功",
    };
});

// 全局共享的联系人数据，所有Mock接口共用
let mockFriendList = Mock.mock([]);
let mockGroupList = Mock.mock([]);
const searchCache = new Map();

Mock.mock(/\/contact\/search/, "post", (options) => {
    let contactId;
    if (options.body instanceof FormData) {
        contactId = options.body.get("contactId")?.trim() || "";
    } else if (typeof options.body === 'string') {
        try {
            const params = JSON.parse(options.body);
            contactId = params.contactId?.trim() || "";
        } catch (e) {
            const formData = new URLSearchParams(options.body);
            contactId = formData.get("contactId")?.trim() || "";
        }
    } else if (typeof options.body === 'object' && options.body !== null) {
        // 处理已解析的JSON对象
        contactId = options.body.contactId?.trim() || "";
    }
    if (!contactId) {
        return {
            code: 400,
            data: null,
            msg: "请输入用户/群组ID"
        };
    }
    const isGroup = /group/i.test(contactId);
    const contactType = isGroup ? "GROUP" : "USER";
    const province = Mock.Random.province()
    const city = Mock.Random.city()
    const areaName = `${province}${city}`

    const mockData = Mock.mock({
        contactId: contactId,
        contactType: contactType,
        nickName: isGroup ? Mock.Random.ctitle(2, 6) : Mock.Random.cname(),
        "status|0-6": 0,
        areaName: areaName
    });
    // 缓存搜索到的联系人名称，用于后续添加时保持一致
    searchCache.set(contactId, mockData.nickName);
    return {
        code: 200,
        data: mockData,
        msg: "搜索成功"
    };
});
Mock.mock(/\/contact\/applyAdd/, "post", (options) => {
    let targetId, contactType;
    // 解析参数逻辑保持不变...
    if (options.body instanceof FormData) {
        targetId = options.body.get('targetId');
        contactType = options.body.get('contactType');
    } else if (typeof options.body === 'string') {
        try {
            const params = JSON.parse(options.body);
            targetId = params.targetId;
            contactType = params.contactType;
        } catch (e) {
            const formData = new URLSearchParams(options.body);
            targetId = formData.get('targetId');
            contactType = formData.get('contactType');
        }
    } else if (typeof options.body === 'object' && options.body !== null) {
        targetId = options.body.targetId;
        contactType = options.body.contactType;
    }
    if (contactType === 'USER') {
        const exists = mockFriendList.find(item => item.contactId === targetId);
        if (!exists) {
            const contactName = searchCache.get(targetId) || Mock.Random.cname();
            mockFriendList.push({ contactId: targetId, contactName: contactName });
        }
    } else if (contactType === 'GROUP') {
        const exists = mockGroupList.find(item => item.contactId === targetId);
        if (!exists) {
            const contactName = searchCache.get(targetId) || (Mock.Random.ctitle(2, 6) + "群聊");
            mockGroupList.push({ contactId: targetId, contactName: contactName });
        }
    }

    return { code: 200, data: null, msg: "申请提交成功" };
});


Mock.mock(/\/contact\/loadContact/, "post", (options) => {
    let contactType;
    if (options.body instanceof FormData) {
        contactType = options.body.get('contactType');
    } else if (typeof options.body === 'string') {
        try {
            const params = JSON.parse(options.body);
            contactType = params.contactType;
        } catch (e) {
            const formData = new URLSearchParams(options.body);
            contactType = formData.get('contactType');
        }
    } else if (typeof options.body === 'object' && options.body !== null) {
        contactType = options.body.contactType;
    }


    let mockData = [];
    if (contactType === 'GROUP') {
        mockData = mockGroupList;
    } else if (contactType === 'USER') {
        mockData = mockFriendList;
    }

    return { code: 200, data: mockData, msg: "获取联系人列表成功" };
});
// 获取用户信息 — 返回默认演示账号信息
Mock.mock('/api/userInfo/getUserInfo', 'post', () => {
    // 直接返回第一个演示账号（客户端无法传 userId 到 mock）
    const defaultAccount = DEMO_ACCOUNTS[0]
    return {
      code: 200,
      data: defaultAccount ? { ...buildUserInfo(defaultAccount) } : {
        userId: 'u_' + Mock.Random.natural(100000, 999999),
        nickName: Mock.Random.cname(),
        sex: Mock.Random.natural(0, 1),
        areaName: Mock.Random.province() + ' ' + Mock.Random.city(),
        joinType: Mock.Random.natural(0, 1),
        personalSignature: '这个人很懒，什么都没留下',
        avatar: '',
      },
      msg: '获取用户信息成功',
    };
});
Mock.mock("/api/userInfo/saveUserInfo", "post", () => {
    return { code: 200, data: null, msg: "保存成功" }
})
Mock.mock("/api/userInfo/updatePassword", "post", () => ({
    code: 200,
    data: null,
    msg: "密码修改成功",
}))