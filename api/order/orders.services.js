import { loggerService } from "../../services/logger.service.js"
import { dbService } from "../../services/db.service.js"
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'airbnb_orders'    

export const ordersService = {
    getById,
    save,
    remove,
    getOrdersByPropertyId,
    getOrdersByUserId,
    isPropertyAvailable,
    blockedDates,
    removeFutureOrdersByPropertyId,
    removeFutureOrdersByUserId
}

async function getById(orderId) {
    try {
        const criteria={_id: ObjectId.createFromHexString(orderId.toString())}
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const order = await collection.findOne(criteria)
        if (!order) throw new Error(`Order with id ${orderId} not found!`)
        loggerService.debug(`OrderService - getById: ${orderId} found`)
        return order
    }
    catch (err) {
        loggerService.error('Cannot get order by id', err)
        throw err
    }
}

async function save(order) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        if (order._id) {
            const criteria={_id: ObjectId.createFromHexString(order._id)}
            delete order._id
            const updateResult = await collection.updateOne(criteria, { $set: order })
            if (updateResult.matchedCount === 0) throw new Error(`Order with id ${order._id} not found!`)
            order._id = criteria._id
            loggerService.debug(`OrderService - update: ${order._id} updated`)
        } else {
            console.log('adding order:', order)
            const insertResult = await collection.insertOne(order)
            order._id = insertResult.insertedId
            loggerService.debug(`OrderService - add: ${order._id} added`)
        }
    } catch (err) {
        loggerService.error('Cannot save order', err)
        throw err
    }
    return getById(order._id)
}

async function remove(orderId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={_id: ObjectId.createFromHexString(orderId)}
        const deleteResult = await collection.deleteOne(criteria)
        if (deleteResult.deletedCount === 0) throw new Error(`Order with id ${orderId} not found!`)
        loggerService.debug(`OrderService - remove: ${orderId} removed`)
    } 
    catch (err) {
        loggerService.error('Cannot remove order', err)
        throw err
    }
}

async function getOrdersByPropertyId(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={propertyId: ObjectId.createFromHexString(propertyId)}
        const propertyOrders = await collection.find(criteria).toArray()
        loggerService.debug(`OrderService - getOrdersByPropertyId: ${propertyId} found ${propertyOrders.length} orders`)
        return propertyOrders
    }
    catch (err) {
        loggerService.error('Cannot get orders by property id', err)
        throw err
    }
}

async function getOrdersByUserId(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={guest:ObjectId.createFromHexString(userId)}
        const userOrders = await collection.find(criteria).toArray()
        loggerService.debug(`OrderService - getOrdersByUserId: ${userId} found ${userOrders.length} orders`)
        return userOrders
    }
    catch (err) {
        loggerService.error('Cannot get orders by user id', err)
        throw err
    }
}

async function isPropertyAvailable(propertyId, from, to) {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const checkin=new Date(from)
    const checkout=new Date(to)
    const criteria={
        propertyId: propertyId,
        $or: [  
            { $and:[ { from: { $lte: checkout }}, { from: { $gte: checkin } } ]},
            { $and:[ { to: { $lte: checkout }}, { to: { $gte: checkin } } ]},
            { $and:[ { from: { $lte: checkin }}, { to: { $gte: checkout } } ]}
        ]
    }
    const conflictingOrders = await collection.find(criteria).toArray()
    return conflictingOrders.length === 0
}

async function blockedDates(propertyId, from=Date.now(), to=new Date(Date.now() + 2*365*24*60*60*1000)) {
    
    const blockedDatesSet = new Set();
    const propertyOrders = await getOrdersByPropertyId(propertyId);
    propertyOrders.forEach(order => {
        const orderFrom = new Date(order.from);
        const orderTo = new Date(order.to);
        if (orderTo < from || orderFrom > to) return; // Skip orders outside the range      
        blockedDatesSet.add([Math.max(orderFrom, from), Math.min(orderTo, to)]);
    });
    return Array.from(blockedDatesSet);
}
async function removeFutureOrdersByPropertyId(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        //const now = new Date();
        const criteria={
            propertyId: propertyId,
        }
        /*
        const orders = await collection.find(criteria).toArray()
        console.log('orders to check for future removal found', orders.length);
        const futureOrders = orders.filter(order => {
                console.log('checking order:', order);
                const from = Date.parse(order.checkIn) 
                console.log('checking order from date:', from, 'against now:', now);
                return from > now
            })
        console.log('futureOrders to be removed:', futureOrders.length);
        */
        const deleteResult = await collection.deleteMany(criteria) /*{
            _id: { $in: futureOrders.map(order => order._id) }
        });
        */
        loggerService.debug(`OrderService - removeFutureOrdersByPropertyId: ${propertyId} removed ${deleteResult.deletedCount} future orders`)
    } 
    catch (err) {
        loggerService.error('Cannot remove future orders by property id', err)
        throw err
    }
}

async function removeFutureOrdersByUserId(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        //const now = new Date();
        const criteria={
            guest: userId,
        }
        const deleteResult = await collection.deleteMany(criteria)
        loggerService.debug(`OrderService - removeFutureOrdersByUserId: ${userId} removed ${deleteResult.deletedCount} future orders`)
    }
    catch (err) {
        loggerService.error('Cannot remove future orders by user id', err)
        throw err
    }
}