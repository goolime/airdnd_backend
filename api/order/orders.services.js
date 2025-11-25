import { loggerService } from "../../services/logger.service.js"
//import { makeId, readJsonFile, writeJsonFile } from '../../services/utils.js'
import { dbService } from "../../services/db.service.js"
import { ObjectId } from 'mongodb'
//const DATA_PATH = './data/order.json'

//const orders = readJsonFile(DATA_PATH)

const COLLECTION_NAME = 'airbnb_orders'    

export const ordersService = {
    getById,
    save,
    remove,
    getOrdersByPropertyId,
    getOrdersByUserId,
    isPropertyAvailable,
    blockedDates
}

async function getById(orderId) {
    try {
        const criteria={_id: ObjectId.createFromHexString(orderId)}
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
    /*
    const idx = orders.findIndex(user => user._id === orderId)
    if (idx === -1) throw new Error(`Order with id ${orderId} not found!`)
    loggerService.debug(`OrderService - getById: ${orderId} found`)
    return orders[idx]
    */
}

async function save(order) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        if (order._id) {
            const criteria={_id: ObjectId.createFromHexString(order._id)}
            const updateResult = await collection.updateOne(criteria, { $set: order })
            if (updateResult.matchedCount === 0) throw new Error(`Order with id ${order._id} not found!`)
            loggerService.debug(`OrderService - update: ${order._id} updated`)
            /*
            console.log('OrderService - save order:', order);
            const idx = orders.findIndex(u => u._id === order._id)
            if (idx === -1) throw new Error(`Order with id ${order._id} not found!`)
            order={...orders[idx], ...order}
            console.log('OrderService - updated order:', order);
            orders[idx] = order
            loggerService.debug(`OrderService - update: ${order._id} updated`)
            */
        } else {
            const insertResult = await collection.insertOne(order)
            order._id = insertResult.insertedId
            loggerService.debug(`OrderService - add: ${order._id} added`)
            /*
            order._id = makeId()
            orders.push(order)
            loggerService.debug(`OrderService - add: ${order._id} added`)
            */
        }
    } catch (err) {
        loggerService.error('Cannot save order', err)
        throw err
    }
    return order
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
    /*
    const idx = orders.findIndex(order => order._id === orderId)
    if (idx === -1) throw new Error(`Order with id ${orderId} not found!`)
    orders.splice(idx, 1)
    writeJsonFile(DATA_PATH, orders)
    */

}

async function getOrdersByPropertyId(propertyId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={propertyId: propertyId}
        const propertyOrders = await collection.find(criteria).toArray()
        loggerService.debug(`OrderService - getOrdersByPropertyId: ${propertyId} found ${propertyOrders.length} orders`)
        return propertyOrders
    }
    catch (err) {
        loggerService.error('Cannot get orders by property id', err)
        throw err
    }
    /*
    const propertyOrders = orders.filter(order => order.propertyId === propertyId)
    loggerService.debug(`OrderService - getOrdersByPropertyId: ${propertyId} found ${propertyOrders.length} orders`)
    return propertyOrders
    */
}

async function getOrdersByUserId(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const criteria={guest: userId}
        const userOrders = await collection.find(criteria).toArray()
        loggerService.debug(`OrderService - getOrdersByUserId: ${userId} found ${userOrders.length} orders`)
        return userOrders
    }
    catch (err) {
        loggerService.error('Cannot get orders by user id', err)
        throw err
    }
    /*
    const userOrders = orders.filter(order => order.guest === userId)
    loggerService.debug(`OrderService - getOrdersByUserId: ${userId} found ${userOrders.length} orders`)
    return userOrders
    */
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

    /*
    const propertyOrders = getOrdersByPropertyId(propertyId).some(order => {
        const orderFrom = new Date(order.from)
        const orderTo = new Date(order.to)
        return (from >= orderFrom && from <= orderTo) ||
                (to >= orderFrom && to <= orderTo) ||
                (from <= orderFrom && to >= orderTo)
        }
    )
    return !propertyOrders;
    */
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