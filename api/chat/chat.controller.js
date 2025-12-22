import { chatService } from '../chat/chat.service.js'
import { loggerService } from '../../services/logger.service.js'
import { messageService } from '../../services/message.service.js'

export const chatController = {
    getUserChats,
    findOrCreateChat,
    getChatById,
    getMessages,
    sendMessage,
    markMessagesAsRead
}

async function getUserChats(req, res) {
    try {
        const userId = req.loggedInUser._id
        const chats = await chatService.getUserChats(userId)
        res.json(chats)
    } catch (error) {
        loggerService.error('Error fetching chats:', error)
        res.status(500).json({ error: 'Failed to fetch chats' })
    }
}

async function findOrCreateChat(req, res) {
    try {
        const { propertyId, hostId } = req.body
        const guestId = req.loggedInUser._id

        if (!propertyId || !hostId) {
            return res.status(400).json({ error: 'PropertyId and hostId are required' })
        }

        const chat = await chatService.findOrCreateChat(
            propertyId,
            guestId,
            hostId
        )

        res.json(chat)
    } catch (error) {
        loggerService.error('Error creating chat:', error)
        res.status(500).json({ error: 'Failed to create chat' })
    }
}

async function getChatById(req, res) {
    try {
        const { chatId } = req.params
        const userId = req.loggedInUser._id

        const chat = await chatService.getChatById(chatId)

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' })
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        )

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' })
        }

        res.json(chat)
    } catch (error) {
        console.error('Error fetching chat:', error)
        res.status(500).json({ error: 'Failed to fetch chat' })
    }
}

async function getMessages(req, res) {
    try {
        const { chatId } = req.params
        const { limit = 50, before } = req.query
        const userId = req.loggedInUser._id

        const chat = await chatService.getChatById(chatId)
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' })
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        )

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const messages = await messageService.getMessages(
            chatId,
            parseInt(limit),
            before
        )

        res.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        res.status(500).json({ error: 'Failed to fetch messages' })
    }
}

async function sendMessage(req, res) {
    try {
        const { chatId } = req.params
        const { content } = req.body
        const senderId = req.loggedInUser._id

        console.log('=== SEND MESSAGE DEBUG ===');
        console.log('chatId:', chatId);
        console.log('content:', content);
        console.log('senderId:', senderId);
        console.log('req.loggedInUser:', req.loggedInUser);
        console.log('=========================');

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' })
        }

        if (content.trim().length > 1000) {
            return res.status(400).json({ error: 'Message is too long (max 1000 characters)' })
        }

        const chat = await chatService.getChatById(chatId)
        console.log('Chat found:', !!chat, chat?._id)
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' })
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === senderId.toString()
        )
        console.log('Is participant?', isParticipant);
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' })
        }
        console.log('Creating message...')
        const message = await messageService.createMessage(
            chatId,
            senderId,
            content
        )
        console.log('Message created:', message);
        const senderRole = chat.participants.find(
            p => p.userId.toString() === senderId.toString()
        ).role
        const otherRole = senderRole === 'guest' ? 'host' : 'guest'

        await chatService.updateChat(chatId, {
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
            [`unreadCount.${otherRole}`]: chat.unreadCount[otherRole] + 1
        })

        const io = req.app.get('io')

        io.to(chatId).emit('message:new', message)

        const activeUsers = req.app.get('activeUsers')
        const otherParticipant = chat.participants.find(
            p => p.userId.toString() !== senderId.toString()
        )

        const otherSocketId = activeUsers.get(otherParticipant.userId.toString())
        if (otherSocketId) {

            const updatedChats = await chatService.getUserChats(
                otherParticipant.userId.toString()
            )
            const updatedChat = updatedChats.find(
                c => c._id.toString() === chatId
            )
            io.to(otherSocketId).emit('chat:update', updatedChat)
        }

        res.status(201).json(message)
    } catch (error) {
        loggerService.error('Error sending message:', error)
        res.status(500).json({ error: 'Failed to send message' })
    }
}

async function markMessagesAsRead(req, res) {
    try {
        const { chatId } = req.params
        const userId = req.loggedInUser._id

        const chat = await chatService.getChatById(chatId)
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' })
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        )

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' })
        }

        await messageService.markMessagesAsRead(chatId, userId)

        const userRole = chat.participants.find(
            p => p.userId.toString() === userId.toString()
        ).role

        await chatService.updateChat(chatId, {
            [`unreadCount.${userRole}`]: 0
        })

        const io = req.app.get('io')
        io.to(chatId).emit('messages:read', { userId, chatId })

        res.json({ success: true })
    } catch (error) {
        loggerService.error('Error marking messages as read:', error)
        res.status(500).json({ error: 'Failed to mark messages as read' })
    }
}
