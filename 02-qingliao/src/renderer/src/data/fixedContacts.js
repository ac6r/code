// 固定联系人和群聊的数据，供 LinkPeople 和 GiveMessage 共用
// senderId 用于动态判断消息归属：
//   - self 标记作为默认值（兼容没有 senderId 的旧消息）
//   - 运行时由 GiveMessage.vue 根据 currentUserId 动态计算 self

export const fixedUsers = [
    { contactId: 'u_fixed1',
      contactType: 'USER',
      nickName: '小明',
      avatar: 'https://robohash.org/u_fixed1?set=set4',
      messages:[
        // 小红问小明 → senderId: 'u_fixed2'（小红）
        {text:'小明,这道题应该怎么做',time:'10:00',self:true, senderId:'u_fixed2'},
        // 小明回答 → senderId: 'u_fixed1'（小明）
        {text:'设未知数为 x,代入公式即可',time:'10:01',self:false, senderId:'u_fixed1'},
        // 小红说谢谢 → senderId: 'u_fixed2'（小红）
        {text:'明白了,谢谢',time:'10:01',self:true, senderId:'u_fixed2'}
      ]

    },
    { contactId: 'u_fixed2',
      contactType: 'USER',
      nickName: '小红',
       avatar: 'https://robohash.org/u_fixed2?set=set4',
      messages:[
        // 小明约小红出去玩 → senderId: 'u_fixed1'（小明）
        {text:'周六有空吗,要不要出去玩', time:'13:14',self:true, senderId:'u_fixed1'},
        // 小红答应 → senderId: 'u_fixed2'（小红）
        {text:'好啊好啊', time:'13:15',self:false, senderId:'u_fixed2'}
      ]
    }
]

export const fixedGroups = [
    { contactId: 'g_fixed1',
      contactType: 'GROUP',
      nickName: '前端技术交流群',
       avatar: 'https://robohash.org/g_fixed1?set=set4',
      messages: [
      // 群聊消息来自不同的人
      { text: '大家有没有好的 Vue 状态管理方案？', time: '08:30', self: false, senderId: 'u_other1' },
      { text: '推荐 Pinia,简单易用', time: '08:31', self: true, senderId: 'u_fixed1' },
      { text: '同意，我们已经从 Vuex 迁移了', time: '08:32', self: false, senderId: 'u_fixed2' },
    ]
    },
    { contactId: 'g_fixed2',
      contactType: 'GROUP',
      nickName: '摸鱼闲聊群',
       avatar: 'https://robohash.org/g_fixed2?set=set4',
      messages: [
      { text: '今天中午吃什么？', time: '11:45', self: false, senderId: 'u_fixed1' },
      { text: '公司楼下新开了家日料', time: '11:46', self: true, senderId: 'u_fixed2' },
      { text: '走起，我请客', time: '11:47', self: false, senderId: 'u_other1' },
    ]
        }
]

// 根据 contactId 查找联系人/群聊名称
export function getContactNameById(contactId) {
    const all = [...fixedUsers, ...fixedGroups]
    const found = all.find(item => item.contactId === contactId)
    return found ? found.nickName : '未知用户'
}