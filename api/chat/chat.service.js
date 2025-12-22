import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'

export const chatService = {

    getUserChats,
    findOrCreateChat,
    getChatById,
    updateChat
}

async function getUserChats(userId) {
    const db = dbService.getDB()

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
                    from: 'airbnb_properties',
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
                    from: 'airbnb_users',
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
        .toArray()

    return chats
}

async function findOrCreateChat(propertyId, guestId, hostId) {
    const db = dbService.getDB()

    // Check if chat exists
    let chat = await db.collection('chats').findOne({
        propertyId: new ObjectId(propertyId),
        'participants.userId': {
            $all: [new ObjectId(guestId), new ObjectId(hostId)]
        }
    });

    if (!chat) {
        console.log('Chat does not exist, creating new one...')

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
        }

        const result = await db.collection('chats').insertOne(newChat)
        chat = { _id: result.insertedId, ...newChat }
        console.log('New chat created:', chat._id)
    } else {
        console.log('Chat already exists:', chat._id)
    }

    // Populate property and user details
    console.log('Looking up property:', propertyId);
    console.log('Looking up users:', [guestId, hostId]);

    // Check if property exists
    const propertyExists = await db.collection('airbnb_properties').findOne({
        _id: new ObjectId(propertyId)
    });
    console.log('Property exists?', !!propertyExists, propertyExists?._id);

    // Check if users exist
    const guestExists = await db.collection('airbnb_users').findOne({
        _id: new ObjectId(guestId)
    });
    const hostExists = await db.collection('airbnb_users').findOne({
        _id: new ObjectId(hostId)
    });
    console.log('Guest exists?', !!guestExists, guestExists?._id);
    console.log('Host exists?', !!hostExists, hostExists?._id);
    const populatedChat = await db.collection('chats')
        .aggregate([
            { $match: { _id: chat._id } },
            {
                $lookup: {
                    from: 'airbnb_properties',
                    localField: 'propertyId',
                    foreignField: '_id',
                    as: 'property'
                }
            },
            {
                $unwind: {
                    path: '$property',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'airbnb_users',
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

    console.log('=== AFTER AGGREGATION ===');
    console.log('populatedChat:', populatedChat);
    console.log('========================');

    // If aggregation failed, return the basic chat without population
    if (!populatedChat) {
        console.warn('Aggregation failed, returning basic chat');
        return chat;
    }

    return populatedChat;
}

async function getChatById(chatId) {
    const db = dbService.getDB()

    const chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId)
    })

    return chat
}

async function updateChat(chatId, updates) {
    const db = dbService.getDB()

    const result = await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId) },
        {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        }
    )

    return result
}
