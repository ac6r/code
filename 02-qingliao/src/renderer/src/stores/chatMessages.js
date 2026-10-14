import { reactive } from "vue";
import {fixedUsers,fixedGroups} from '../data/fixedContacts'
const chatMessages = reactive({})
function initFixedContactMessages(){
    const allFixed = [...fixedUsers, ...fixedGroups]
    allFixed.forEach(item =>{
        if(!chatMessages[item.contactId]){
            // 固定会话不再预置消息，统一从空数组开始
            chatMessages[item.contactId] = []
        }
    })
}

export function useChatMessages() {
    const getMessages = (contactId) => {
        if (!chatMessages[contactId]) {
            initFixedContactMessages()
            if(!chatMessages[contactId]){
                chatMessages[contactId] = []
            }
        }
        return chatMessages[contactId]
    }


    const addMessage = (contactId, message) => {
        const msgs = getMessages(contactId)
        msgs.push(message)
    }
    return {
        getMessages,
        addMessage
    }
}
