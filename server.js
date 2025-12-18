import express from 'express';
import cors from 'cors';
import { loggerService } from './services/logger.service.js';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

//* ------------------- Config -------------------

const corsOptions = {
    origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174'
    ],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(express.json());
app.set('query parser', 'extended');
app.use(cookieParser());

//* ------------------- Socket.io Setup -------------------

// Store active users (userId -> socketId)
const activeUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
    loggerService.info(`User connected: ${socket.id}`);

    // User joins with their userId
    socket.on('user:join', (userId) => {
        activeUsers.set(userId, socket.id);
        loggerService.info(`User ${userId} joined with socket ${socket.id}`);
    });

    // User joins a specific conversation room
    socket.on('conversation:join', (conversationId) => {
        socket.join(conversationId);
        loggerService.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // User leaves a conversation room
    socket.on('conversation:leave', (conversationId) => {
        socket.leave(conversationId);
        loggerService.info(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // User disconnects
    socket.on('disconnect', () => {
        // Remove user from active users
        for (let [userId, socketId] of activeUsers.entries()) {
            if (socketId === socket.id) {
                activeUsers.delete(userId);
                loggerService.info(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Make io and activeUsers accessible in routes
app.set('io', io);
app.set('activeUsers', activeUsers);

//* ------------------- Routes -------------------
import propertyRoutes from './api/property/property.routs.js';
import userRoutes from './api/user/user.routs.js';
import orderRoutes from './api/order/orders.routs.js';
import authRoutes from './api/auth/auth.routes.js';
import conversationRoutes from './api/conversation/conversation.routes.js'; // ADD THIS

app.use('/api/property', propertyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes); // ADD THIS

//* For SPA (Single Page Application) - catch all routes and send to the index.html
app.get('/**', (req, res) => { // CHANGED /*all to /**
    res.sendFile(path.resolve('public/index.html'));
});

const port = process.env.PORT || 3030;
server.listen(port, () => {
    loggerService.info(`Server listening on port http://localhost:${port}/`);
    loggerService.info(`Socket.io ready for connections`);
});