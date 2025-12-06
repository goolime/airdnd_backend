import { ordersService } from './orders.services.js'
import { propertyService } from '../property/property.service.js'
import { loggerService } from '../../services/logger.service.js'
import { usersService } from '../user/users.service.js'

export async function getOrdersByPropertyId(req, res) {
    const { propertyId } = req.params
    try {
        const orders = await ordersService.getOrdersByPropertyId(propertyId)
        loggerService.info(`Orders for property ${propertyId} retrieved successfully`)
        res.send(orders)
    }
    catch (err) {
        loggerService.error(`Cannot get orders for property ${propertyId}`, err)
        res.status(400).send({ err: `Cannot get orders for property ${propertyId}` })
    }
}

export async function getOrdersByUserId(req, res) {
    const { userId } = req.params
    try {
        const orders = await ordersService.getOrdersByUserId(userId)
        loggerService.info(`Orders for user ${userId} retrieved successfully`)
        res.send(orders)
    }
    catch (err) {
        loggerService.error(`Cannot get orders for user ${userId}`, err)
        res.status(400).send({ err: `Cannot get orders for user ${userId}` })
    }
}

export async function getOrderById(req, res) {
    const { orderId } = req.params
    try {
        
        const order = await ordersService.getById(orderId)
        res.send(await _prepForUI(order))
        loggerService.info(`Order ${orderId} retrieved successfully`)
    }
    catch (err) {
        loggerService.error(`Cannot get order ${orderId}`, err)
        res.status(400).send({ err: `Cannot get order ${orderId}` })
    }
}

export async function addOrder(req, res) {
    const {propertyId, guest, checkIn, checkOut, guests} = req.body;
    
    try {
        if (!propertyId || !guest || !checkIn || !checkOut || !guests || guest?.adults<=0 || guest?.kids<0 || guest?.infants<0 || guest?.pets<0 ) 
            throw new Error('Missing required fields: propertyId, guest, checkIn, checkOut, guests with valid counts')
        const orderData = {propertyId, guest, checkIn, checkOut, guests};
        await setTotalPrice(orderData, orderData.propertyId);
        const addedOrder = await ordersService.save(orderData)
        res.send(await _prepForUI(addedOrder))
        loggerService.info(`Order ${addedOrder._id} added successfully`)
    }
    catch (err) {
        loggerService.error(`Cannot add order`, err)
        res.status(400).send({ err: `Cannot add order` })
    }
}
export async function updateOrder(req, res) {
    const { orderId } = req.params
    const { checkIn, checkOut, guests} = req.body;
    const orderData = {startDate: checkIn, endDate: checkOut, guests};
    if(!orderData.startDate) delete orderData.startDate;
    if(!orderData.endDate) delete orderData.endDate;
    if(!orderData.guests || Object.keys(orderData.guests).length===0) delete orderData.guests;
    try {
        if (Object.keys(orderData).length===0) 
            return res.status(400).send({ err: `No fields to update for order ${orderId}` })
        
        orderData._id = orderId;
        if(orderData.startDate || orderData.endDate){
            const existingOrder = await ordersService.getById(orderId);
            const tmpOrder = {...await ordersService.getById(orderId)}
            if(orderData.startDate) tmpOrder.startDate=orderData.startDate;
            if(orderData.endDate) tmpOrder.endDate=orderData.endDate;
            await setTotalPrice(tmpOrder, existingOrder.propertyId);
            orderData.totalPrice=tmpOrder.totalPrice;
        }
        const updatedOrder = await ordersService.save(orderData)
        console.log('updatedOrder:', updatedOrder);
        res.send(await _prepForUI(updatedOrder))
        loggerService.info(`Order ${orderId} updated successfully`)
    }
    catch (err) {
        loggerService.error(`Cannot update order ${orderId}`, err)
        res.status(400).send({ err: `Cannot update order ${orderId}` })
    }
}

export async function removeOrder(req, res) {
    const { orderId } = req.params
    try {
        await ordersService.remove(orderId)
        res.send({ msg: `Order ${orderId} removed successfully` })
        loggerService.info(`Order ${orderId} removed successfully`)
    }
    catch (err) {
        loggerService.error(`Cannot remove order ${orderId}`, err)
        res.status(400).send({ err: `Cannot remove order ${orderId}` })
    }
}

async function _prepForUI(order) {
    const prepOrder={...order};
    const property = await propertyService.getById(prepOrder.propertyId);
    delete prepOrder.propertyId;
    prepOrder.checkIn 
    prepOrder.checkOut 
    prepOrder.guest = await usersService.getMiniUserById(prepOrder.guest);
    prepOrder.host = await usersService.getMiniUserById(property.host);
    prepOrder.property = {
        _id: property._id,
        name: property.name,
        imgUrl: property.imgUrls,
    };
    return prepOrder;
}

async function setTotalPrice(order, propertyId) {
    const property = await propertyService.getById(propertyId);
    if (!property) throw new Error(`Property with id ${propertyId} not found`);
    const checkInDate = Date.parse(order.checkIn);
    const checkOutDate = Date.parse(order.checkOut);
    order.totalPrice = property.price * ((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

}