import { expect } from 'chai'
import mongoose from 'mongoose'
import { connectDB, closeDB } from '../../config/db.js'
import dotenv from 'dotenv'

describe('Database Configuration (db.js)', function () {
    this.timeout(10000)

    before(() => {
        dotenv.config()
        this.originalMongoUriTest = process.env.MONGODB_URI_TEST
    })

    after(() => {
        if (this.originalMongoUriTest) {
            process.env.MONGODB_URI_TEST = this.originalMongoUriTest
        } else {
            delete process.env.MONGODB_URI_TEST
        }
    })

    describe('connectDB()', () => {
        afterEach(async () => {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect()
            }
        })

        it('should connect to test database when NODE_ENV=test', async () => {
            process.env.NODE_ENV = 'test'
            process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/retrogamingdbtest'

            await connectDB()

            expect(mongoose.connection.readyState).to.equal(1)
            expect(mongoose.connection._connectionString).to.equal(process.env.MONGODB_URI_TEST)
        })

        it('should use default test URI when MONGODB_URI_TEST is not set', async () => {
            process.env.NODE_ENV = 'test'
            const originalUri = process.env.MONGODB_URI_TEST
            delete process.env.MONGODB_URI_TEST

            await connectDB()

            expect(mongoose.connection.readyState).to.equal(1)
            expect(mongoose.connection._connectionString).to.equal('mongodb://localhost:27017/retrogamingdbtest')

            if (originalUri) process.env.MONGODB_URI_TEST = originalUri
        })

        it('should throw error when connection fails', async () => {
            process.env.NODE_ENV = 'test'
            const originalConnect = mongoose.connect
            mongoose.connect = () => Promise.reject(new Error('Simulated connection error'))

            try {
                await connectDB()
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.an('error')
                expect(error.message).to.equal('Simulated connection error')
            } finally {
                mongoose.connect = originalConnect
                process.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/retrogamingdbtest'
            }
        })
    })

    describe('closeDB()', () => {
        beforeEach(async () => {
            await connectDB()
        })

        it('should disconnect from MongoDB successfully', async () => {
            await closeDB()
            expect(mongoose.connection.readyState).to.equal(0)
        })

        it('should throw error when disconnection fails', async () => {
            const originalDisconnect = mongoose.disconnect
            mongoose.disconnect = () => Promise.reject(new Error('Forced disconnection error'))

            try {
                await closeDB()
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.an('error')
                expect(error.message).to.equal('Forced disconnection error')
            } finally {
                mongoose.disconnect = originalDisconnect
            }
        })
    })
})