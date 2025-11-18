import { loggerService } from "../../services/logger.service.js"
import { makeId, readJsonFile, writeJsonFile } from '../../services/utils.js'

const DATA_PATH = './data/order.json'

const orders = readJsonFile(DATA_PATH)

export const ordersService = {
    getById,
    save,
    remove,
    getOrdersByPropertyId,
    getOrdersByUserId,
    isPropertyAvailable,
    blockedDates
}

function getById(orderId) {
    const idx = orders.findIndex(user => user._id === orderId)
    if (idx === -1) throw new Error(`Order with id ${orderId} not found!`)
    loggerService.debug(`OrderService - getById: ${orderId} found`)
    return orders[idx]
}

function save(order) {
    if (order._id) {
        
        console.log('OrderService - save order:', order);
        const idx = orders.findIndex(u => u._id === order._id)
        if (idx === -1) throw new Error(`Order with id ${order._id} not found!`)
        order={...orders[idx], ...order}
        console.log('OrderService - updated order:', order);
        orders[idx] = order
        loggerService.debug(`OrderService - update: ${order._id} updated`)
    } else {
        order._id = makeId()
        orders.push(order)
        loggerService.debug(`OrderService - add: ${order._id} added`)
    }
    writeJsonFile(DATA_PATH, orders)
    return order
}

function remove(orderId) {
    const idx = orders.findIndex(order => order._id === orderId)
    if (idx === -1) throw new Error(`Order with id ${orderId} not found!`)
    orders.splice(idx, 1)
    writeJsonFile(DATA_PATH, orders)
    loggerService.debug(`OrderService - remove: ${orderId} removed`)
}

function getOrdersByPropertyId(propertyId) {
    const propertyOrders = orders.filter(order => order.propertyId === propertyId)
    loggerService.debug(`OrderService - getOrdersByPropertyId: ${propertyId} found ${propertyOrders.length} orders`)
    return propertyOrders
}

function getOrdersByUserId(userId) {
    const userOrders = orders.filter(order => order.guest === userId)
    loggerService.debug(`OrderService - getOrdersByUserId: ${userId} found ${userOrders.length} orders`)
    return userOrders
}

function isPropertyAvailable(propertyId, from, to) {
    const propertyOrders = getOrdersByPropertyId(propertyId).some(order => {
        const orderFrom = new Date(order.from)
        const orderTo = new Date(order.to)
        return (from >= orderFrom && from <= orderTo) ||
                (to >= orderFrom && to <= orderTo) ||
                (from <= orderFrom && to >= orderTo)
        }
    )
    return !propertyOrders;
}

function blockedDates(propertyId, from=Date.now(), to=new Date(Date.now() + 2*365*24*60*60*1000)) {
    const blockedDatesSet = new Set();
    const propertyOrders = getOrdersByPropertyId(propertyId);
    propertyOrders.forEach(order => {
        const orderFrom = new Date(order.from);
        const orderTo = new Date(order.to);
        if (orderTo < from || orderFrom > to) return; // Skip orders outside the range      
        blockedDatesSet.add([Math.max(orderFrom, from), Math.min(orderTo, to)]);
    });
    return Array.from(blockedDatesSet);
}

function _CheckisOwnerOrGuest(orderId, userId) {
    const order = getById(orderId);
    if (order.guest !== userId && order.ownerId !== userId) {
        throw new Error(`User with id ${userId} is neither guest nor property owner of order ${orderId}`);
    }
    return true;
}