// 固定联系人和群聊的基础信息（供 LinkPeople 和 GiveMessage 共用）
// 说明：这里只保留联系人本身的信息，不再预置任何聊天记录，
// 四个会话都从空白开始，消息全部来自真实交互（自己发送 + AI 回复）。

export const fixedUsers = [
    {
        contactId: 'u_fixed1',
        contactType: 'USER',
        nickName: '小明',
        avatar: ''
    },
    {
        contactId: 'u_fixed2',
        contactType: 'USER',
        nickName: '小红',
        avatar: ''
    }
]

export const fixedGroups = [
    {
        contactId: 'g_fixed1',
        contactType: 'GROUP',
        nickName: '前端技术交流群',
        avatar: ''
    },
    {
        contactId: 'g_fixed2',
        contactType: 'GROUP',
        nickName: '摸鱼闲聊群',
        avatar: ''
    }
]

// 根据 contactId 查找联系人/群聊名称
export function getContactNameById(contactId) {
    const all = [...fixedUsers, ...fixedGroups]
    const found = all.find(item => item.contactId === contactId)
    return found ? found.nickName : '未知用户'
}
