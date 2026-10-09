import { reactive } from "vue";
import { fixedUsers, fixedGroups } from "../data/fixedContacts";
const contacts = reactive({})

// 初始化固定联系人
fixedUsers.forEach(u => {
    contacts[u.contactId] = { nickName: u.nickName, contactType: u.contactType,avatar:u.avatar }
})
fixedGroups.forEach(g => {
    contacts[g.contactId] = { nickName: g.nickName, contactType: g.contactType,avatar:g.avatar }
})
export function useContacts() {
    const getContact = (id) => contacts[id] || { nickName: '未知用户', contactType: 'USER' }
    const addContact = (id, info) => {
        contacts[id] = info
    }
    const updateContacts = (dataList, type) => {
        dataList.forEach(item => {
            if (!contacts[item.contactId]) {
                contacts[item.contactId] = {
                    nickName: item.contactName,
                    contactType: type,
                      avatar: item.avatar || '' 
                }
            }
        })
    }
    return { getContact, addContact, updateContacts, contacts }
}