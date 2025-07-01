import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {
    try {
        const uri = process.env.NODE_ENV === 'test'
            ? process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/retrogamingdbtest'
            : process.env.MONGODB_URI || 'mongodb://localhost:27017/retrogamingdb'

        console.log(`🔄 Connecting to MongoDB at: ${uri.replace(/:([^/]*)@/, ':*****@')}`)

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
        })

        console.log('✅ MongoDB connected')
    } catch (error) {
        console.error('❌ MongoDB connection error:', error)
        throw error
    }
}

export const closeDB = async () => {
    try {
        await mongoose.disconnect()
        console.log('✅ MongoDB disconnected')
    } catch (error) {
        console.error('❌ MongoDB disconnection error:', error)
        throw error
    }
}