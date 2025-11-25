import express from 'express'
import { registerUser, loginUser, logoutUser  } from './auth.controller.js'
import { log } from '../../midlewares/log.middleware.js'
const router = express.Router()

router.post('/signin', log, registerUser)
router.post('/login', log, loginUser)
router.post('/logout', log, logoutUser)

const authRoutes = router
export default authRoutes
