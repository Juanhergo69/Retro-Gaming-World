import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
    origin: 'retro-gaming-world.surge.sh',
    credentials: true
}))
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/users', userRoutes)

app.use(errorHandler)

export default app