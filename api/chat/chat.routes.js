import express from 'express'
import { chatController } from './chat.controller.js'
import { requireAuth } from '../../midlewares/require-auth.middleware.js'


const router = express.Router();

router.get('/', requireAuth, chatController.getUserChats);

router.post('/find-or-create', requireAuth, chatController.findOrCreateChat);

router.get('/:chatId', requireAuth, chatController.getChatById);

router.get('/:chatId/messages', requireAuth, chatController.getMessages);

router.post('/:chatId/messages', requireAuth, chatController.sendMessage);

router.post('/:chatId/read', requireAuth, chatController.markMessagesAsRead);

export default router;