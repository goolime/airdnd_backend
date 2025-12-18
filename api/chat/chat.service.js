import { ObjectId } from 'mongodb';
import { dbService } from '../../services/db.service.js';

export const chatService = {
    // Get all chats for a user
    async getUsercChats(userId) {
        const db = dbService.getDB();
        
        const chats = await db.collection('chats')
            .aggregate([
                {
                    $match: {
                        'participants.userId': new ObjectId(userId)
                    }
                },
                {
                    $sort: { lastMessageAt: -1 }
                },
                {
                    $lookup: {
                        from: 'properties',
                        localField: 'propertyId',
                        foreignField: '_id',
                        as: 'property'
                    }
                },
                {
                    $unwind: '$property'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'participants.userId',
                        foreignField: '_id',
                        as: 'participantDetails'
                    }
                },
                {
                    $project: {
                        propertyId: 1,
                        property: {
                            _id: 1,
                            name: 1,
                            imgUrls: 1
                        },
                        participants: {
                            $map: {
                                input: '$participants',
                                as: 'participant',
                                in: {
                                    userId: '$$participant.userId',
                                    role: '$$participant.role',
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$participantDetails',
                                                    as: 'detail',
                                                    cond: { $eq: ['$$detail._id', '$$participant.userId'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        lastMessage: 1,
                        lastMessageAt: 1,
                        unreadCount: 1,
                        createdAt: 1
                    }
                },
                {
                    $project: {
                        'participants.user.password': 0,
                        'participants.user.email': 0
                    }
                }
            ])
            .toArray();
        
        return chats;
    },

    // Find or create chat
    async findOrCreateChat(propertyId, guestId, hostId) {
        const db = dbService.getDB();
        
        // Check if chat exists
        let chat = await db.collection('chats').findOne({
            propertyId: new ObjectId(propertyId),
            'participants.userId': { 
                $all: [new ObjectId(guestId), new ObjectId(hostId)] 
            }
        });

        if (!chat) {
            // Create new chat
            const newChat = {
                propertyId: new ObjectId(propertyId),
                participants: [
                    { userId: new ObjectId(guestId), role: 'guest' },
                    { userId: new ObjectId(hostId), role: 'host' }
                ],
                lastMessage: '',
                lastMessageAt: new Date(),
                unreadCount: {
                    guest: 0,
                    host: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('chats').insertOne(newChat);
            chat = { _id: result.insertedId, ...newChat };
        }

        // Populate property and user details
        chat = await db.collection('chats')
            .aggregate([
                { $match: { _id: chat._id } },
                {
                    $lookup: {
                        from: 'properties',
                        localField: 'propertyId',
                        foreignField: '_id',
                        as: 'property'
                    }
                },
                { $unwind: '$property' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'participants.userId',
                        foreignField: '_id',
                        as: 'participantDetails'
                    }
                },
                {
                    $project: {
                        propertyId: 1,
                        property: {
                            _id: 1,
                            name: 1,
                            imgUrls: 1
                        },
                        participants: {
                            $map: {
                                input: '$participants',
                                as: 'participant',
                                in: {
                                    userId: '$$participant.userId',
                                    role: '$$participant.role',
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$participantDetails',
                                                    as: 'detail',
                                                    cond: { $eq: ['$$detail._id', '$$participant.userId'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        lastMessage: 1,
                        lastMessageAt: 1,
                        unreadCount: 1,
                        createdAt: 1
                    }
                },
                {
                    $project: {
                        'participants.user.password': 0,
                        'participants.user.email': 0
                    }
                }
            ])
            .next();

        return chat;
    },

    // Get chat by ID
    async getChatById(chatId) {
        const db = dbService.getDB();
        
        const chat = await db.collection('chats').findOne({
            _id: new ObjectId(chatId)
        });
        
        return chat;
    },

    // Update chat
    async updateChat(chatId, updates) {
        const db = dbService.getDB();
        
        const result = await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            { 
                $set: { 
                    ...updates,
                    updatedAt: new Date() 
                } 
            }
        );
        
        return result;
    }
};