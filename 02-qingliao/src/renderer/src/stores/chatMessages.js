import { reactive } from "vue";
import {fixedUsers,fixedGroups} from '../data/fixedContacts'
const chatMessages = reactive({})
function initFixedContactMessages(){
    const allFixed = [...fixedUsers, ...fixedGroups]
    allFixed.forEach(item =>{
        if(!chatMessages[item.contactId]){
            chatMessages[item.contactId] = [...(item.messages) || []]
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