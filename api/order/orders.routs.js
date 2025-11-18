import express from 'express'
import { getOrderById,addOrder, updateOrder, removeOrder, } from './orders.controller.js'
import { log } from '../../midlewares/log.middleware.js'
import { requireAuth } from '../../midlewares/require-auth.middleware.js'

const router = express.Router()

router.get('/:orderId', log, requireAuth, getOrderById)
router.post('/', log, requireAuth, addOrder)
router.put('/:orderId', log, requireAuth, updateOrder)
router.delete('/:orderId', log, requireAuth, removeOrder)

const orderRoutes = router
export default orderRoutes