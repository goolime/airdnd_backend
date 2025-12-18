import { chatService } from '../chat/chat.service.js';
import { loggerService } from '../../services/logger.service.js';
import { messageService } from '../../services/message.service.js';

export const chatController = {
    // Get all chats for a user
    async getUserChats(req, res) {
        try {
            const userId = req.loggedInUser._id;
            const chats = await chatService.getUserChats(userId);
            res.json(chats);
        } catch (error) {
            loggerService.error('Error fetching chats:', error);
            res.status(500).json({ error: 'Failed to fetch chats' });
        }
    },

    // Get or create a chat
    async findOrCreateChat(req, res) {
        try {
            const { propertyId, hostId } = req.body;
            const guestId = req.loggedInUser._id;

            if (!propertyId || !hostId) {
                return res.status(400).json({ error: 'PropertyId and hostId are required' });
            }

            const chat = await chatService.findOrCreateChat(
                propertyId,
                guestId,
                hostId
            );

            res.json(chat);
        } catch (error) {
            loggerService.error('Error creating chat:', error);
            res.status(500).json({ error: 'Failed to create chat' });
        }
    },

    // Get chat by ID
    async getChatById(req, res) {
        try {
            const { chatId } = req.params;
            const userId = req.loggedInUser._id;

            const chat = await chatService.getChatById(chatId);

            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            // Check if user is participant
            const isParticipant = chat.participants.some(
                p => p.userId.toString() === userId.toString()
            );

            if (!isParticipant) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json(chat);
        } catch (error) {
            console.error('Error fetching chat:', error);
            res.status(500).json({ error: 'Failed to fetch chat' });
        }
    },

    // Get messages for a chat
    async getMessages(req, res) {
        try {
            const { chatId } = req.params;
            const { limit = 50, before } = req.query;
            const userId = req.loggedInUser._id;

            // Verify user is participant
            const chat = await chatService.getChatById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const isParticipant = chat.participants.some(
                p => p.userId.toString() === userId.toString()
            );

            if (!isParticipant) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const messages = await messageService.getMessages(
                chatId,
                parseInt(limit),
                before
            );

            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    },

    // Send a message
    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { content } = req.body;
            const senderId = req.loggedInUser._id;

            // Validation
            if (!content || !content.trim()) {
                return res.status(400).json({ error: 'Message content is required' });
            }

            if (content.trim().length > 1000) {
                return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
            }

            // Verify user is participant
            const chat = await chatService.getChatById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const isParticipant = chat.participants.some(
                p => p.userId.toString() === senderId.toString()
            );

            if (!isParticipant) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Create message
            const message = await messageService.createMessage(
                chatId,
                senderId,
                content
            );

            // Update chat metadata
            const senderRole = chat.participants.find(
                p => p.userId.toString() === senderId.toString()
            ).role;
            const otherRole = senderRole === 'guest' ? 'host' : 'guest';

            await chatService.updateChat(chatId, {
                lastMessage: content.trim(),
                lastMessageAt: new Date(),
                [`unreadCount.${otherRole}`]: chat.unreadCount[otherRole] + 1
            });

            // Emit socket events
            const io = req.app.get('io');
            
            // Emit to chat room
            io.to(chatId).emit('message:new', message);

            // Notify other user if online
            const activeUsers = req.app.get('activeUsers');
            const otherParticipant = chat.participants.find(
                p => p.userId.toString() !== senderId.toString()
            );
            
            const otherSocketId = activeUsers.get(otherParticipant.userId.toString());
            if (otherSocketId) {
                // Send updated chat to other user
                const updatedChats = await chatService.getUserChats(
                    otherParticipant.userId.toString()
                );
                const updatedChat = updatedChats.find(
                    c => c._id.toString() === chatId
                );
                io.to(otherSocketId).emit('chat:update', updatedChat);
            }

            res.status(201).json(message);
        } catch (error) {
            loggerService.error('Error sending message:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    },

    // Mark messages as read
    async markMessagesAsRead(req, res) {
        try {
            const { chatId } = req.params;
            const userId = req.loggedInUser._id;

            // Verify user is participant
            const chat = await chatService.getChatById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const isParticipant = chat.participants.some(
                p => p.userId.toString() === userId.toString()
            );

            if (!isParticipant) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Update messages
            await messageService.markMessagesAsRead(chatId, userId);

            // Reset unread count
            const userRole = chat.participants.find(
                p => p.userId.toString() === userId.toString()
            ).role;

            await chatService.updateChat(chatId, {
                [`unreadCount.${userRole}`]: 0
            });

            // Emit socket event
            const io = req.app.get('io');
            io.to(chatId).emit('messages:read', { userId, chatId });

            res.json({ success: true });
        } catch (error) {
            loggerService.error('Error marking messages as read:', error);
            res.status(500).json({ error: 'Failed to mark messages as read' });
        }
    }
};