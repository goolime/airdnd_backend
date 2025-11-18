import express from 'express'
import { getProperties, getProperty, removeProperty, addProperty, updateProperty, getPropertiesByCity, postReview } from './property.controller.js'
import { getOrdersByPropertyId } from '../order/orders.controller.js'
import { log } from '../../midlewares/log.middleware.js'
import { requireAuth } from '../../midlewares/require-auth.middleware.js'

const router = express.Router()

router.post('/review/:propertyId', log, requireAuth, postReview)
router.get('/city/', log, getPropertiesByCity)
router.get('/:propertyId', log, getProperty)
router.get('/:propertyId/orders/', log, requireAuth, getOrdersByPropertyId)
router.delete('/:propertyId', log, requireAuth, removeProperty)
router.put('/:propertyId', log, requireAuth, updateProperty)
router.get('/', log, getProperties)
router.post('/', log, requireAuth, addProperty)

const propertyRoutes = router
export default propertyRoutes