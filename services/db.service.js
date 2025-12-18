import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'
import { loggerService as logger, loggerService } from './logger.service.js'

export const dbService = { getCollection, createIndexes, getDB, closeDB }

var dbConn = null
var client = null

async function getCollection(collectionName) {
    try {
        const db = await _connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function _connect() {
    if (dbConn) return dbConn

    try {
        client = await MongoClient.connect(config.dbURL)
        dbConn = client.db(config.dbName)
        await createIndexes()
        
        return dbConn
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        throw err
    }
}

async function createIndexes() {
    try {
        const db = await _connect()
        
        // Chats indexes
        await db.collection('chats').createIndex({ 'participants.userId': 1 })
        await db.collection('chats').createIndex({ propertyId: 1 })
        await db.collection('chats').createIndex({ lastMessageAt: -1 })

        // Messages indexes
        await db.collection('messages').createIndex({ chatId: 1, createdAt: -1 })
        await db.collection('messages').createIndex({ senderId: 1 })

        loggerService.info('Database indexes created')
    } catch (error) {
        loggerService.error('Error creating indexes:', error)
    }
}

function getDB() {
    if (!dbConn) {
        throw new Error('Database not initialized. Call getCollection first.')
    }
    return dbConn
}

async function closeDB() {
    if (client) {
        await client.close()
        dbConn = null
        client = null
        loggerService.info('Database connection closed')
    }
}