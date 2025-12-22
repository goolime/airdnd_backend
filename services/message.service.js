import { ObjectId } from 'mongodb'
import { dbService } from './db.service.js'

export const messageService = {

    getMessages,
    createMessage,
    markMessagesAsRead
}

async function getMessages(chatId, limit = 50, before = null) {
    
    const db = dbService.getDB()

    const query = { chatId: new ObjectId(chatId) }
    if (before) {
        query.createdAt = { $lt: new Date(before) }
    }

    const messages = await db.collection('messages')
        .aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'airbnb_users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            { $unwind: '$sender' },
            {
                $project: {
                    chatId: 1,
                    senderId: 1,
                    content: 1,
                    readBy: 1,
                    messageType: 1,
                    createdAt: 1,
                    sender: {
                        _id: 1,
                        fullname: 1,
                        imgUrl: 1
                    }
                }
            }
        ])
        .toArray()

    return messages.reverse()
}

async function createMessage(chatId, senderId, content) {
    const db = dbService.getDB()

    const message = {
        chatId: new ObjectId(chatId),
        senderId: new ObjectId(senderId),
        content: content.trim(),
        readBy: [new ObjectId(senderId)],
        messageType: 'text',
        createdAt: new Date()
    }

    const result = await db.collection('messages').insertOne(message)

    const newMessage = await db.collection('messages')
        .aggregate([
            { $match: { _id: result.insertedId } },
            {
                $lookup: {
                    from: 'airbnb_users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            { $unwind: '$sender' },
            {
                $project: {
                    chatId: 1,
                    senderId: 1,
                    content: 1,
                    readBy: 1,
                    messageType: 1,
                    createdAt: 1,
                    sender: {
                        _id: 1,
                        fullname: 1,
                        imgUrl: 1
                    }
                }
            }
        ])
        .next()

    return newMessage
}

async function markMessagesAsRead(chatId, userId) {
    const db = dbService.getDB()

    const result = await db.collection('messages').updateMany(
        {
            chatId: new ObjectId(chatId),
            senderId: { $ne: new ObjectId(userId) },
            readBy: { $ne: new ObjectId(userId) }
        },
        {
            $addToSet: { readBy: new ObjectId(userId) }
        }
    )

    return result
}
