import express from 'express';
import cors from 'cors';
import { loggerService } from './services/logger.service.js';
import path from 'path';


const app = express()

//* ------------------- Config -------------------

const corsOptions = {
    origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174'
    ],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.static('public'))
app.use(express.json())
app.set('query parser', 'extended')

//* ------------------- Routes -------------------
import propertyRoutes from './api/property/property.routs.js'
import userRoutes from './api/user/user.routs.js'
import orderRoutes from './api/order/orders.routs.js'
app.use('/api/property', propertyRoutes)
app.use('/api/user', userRoutes)
app.use('/api/order', orderRoutes)

//* For SPA (Single Page Application) - catch all routes and send to the index.html
app.get('/*all', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030
app.listen(port, () =>
    loggerService.info(`Server listening on port http://localhost:${port}/`)
)