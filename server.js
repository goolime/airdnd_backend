import express from 'express'
import cors from 'cors'
import { loggerService } from './services/logger.service.js'
import path from 'path'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { dbService } from './services/db.service.js'
import { initializePropertyIndexes } from './services/initializeIndexes.js'

const app = express()
const server = createServer(app)
app.set('trust proxy', 1)

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
})

//* ------------------- Config -------------------

const corsOptions = {
    origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174',
        process.env.CLIENT_URL
    ],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.static('public'))
app.use(express.json())
app.set('query parser', 'extended')
app.use(cookieParser())

//* ------------------- Socket.io Setup -------------------

const activeUsers = new Map()

io.on('connection', (socket) => {
    loggerService.info(`User connected: ${socket.id}`)

    socket.on('user:join', (userId) => {
        activeUsers.set(userId, socket.id)
        loggerService.info(`User ${userId} joined with socket ${socket.id}`)
    })

    socket.on('chat:join', (chatId) => {
        socket.join(chatId)
        loggerService.info(`Socket ${socket.id} joined chat ${chatId}`)
    })

    socket.on('chat:leave', (chatId) => {
        socket.leave(chatId)
        loggerService.info(`Socket ${socket.id} left chat ${chatId}`)
    })

    socket.on('disconnect', () => {
        for (let [userId, socketId] of activeUsers.entries()) {
            if (socketId === socket.id) {
                activeUsers.delete(userId)
                loggerService.info(`User ${userId} disconnected`)
                break
            }
        }
    })
})

app.set('io', io)
app.set('activeUsers', activeUsers)

//* ------------------- Routes -------------------
import propertyRoutes from './api/property/property.routs.js'
import userRoutes from './api/user/user.routs.js'
import orderRoutes from './api/order/orders.routs.js'
import authRoutes from './api/auth/auth.routes.js'
import chatRoutes from './api/chat/chat.routes.js'

app.use('/api/property', propertyRoutes)
app.use('/api/user', userRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/chats', chatRoutes)

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

//* ------------------- Start Server -------------------
const port = process.env.PORT || 3030

async function startServer() {
    try {

        await dbService.getCollection('airdnd_users')
        loggerService.info('Database connected successfully')
        await initializePropertyIndexes()
        server.listen(port, () => {
            loggerService.info(`Server listening on port http://localhost:${port}/`)
            loggerService.info(`Socket.io ready for connections`)
        })
    } catch (err) {
        loggerService.error('Failed to start server:', err)
        process.exit(1)
    }
}

startServer()