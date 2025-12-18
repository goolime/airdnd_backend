import express from 'express';
import { chatController } from './chat.controller.js';
import { requireAuth } from '../../midlewares/require-auth.middleware.js';
// Import your auth middleware (adjust path as needed)


const router = express.Router();

// Get all chats for a user
router.get('/', requireAuth, chatController.getUserChats);

// Get or create a chat
router.post('/find-or-create', requireAuth, chatController.findOrCreateChat);

// Get chat by ID
router.get('/:chatId', requireAuth, chatController.getChatById);

// Get messages for a chat
router.get('/:chatId/messages', requireAuth, chatController.getMessages);

// Send a message
router.post('/:chatId/messages', requireAuth, chatController.sendMessage);

// Mark messages as read
router.post('/:chatId/read', requireAuth, chatController.markMessagesAsRead);

export default router;