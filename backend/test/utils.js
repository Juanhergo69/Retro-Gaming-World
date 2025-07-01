import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Game from '../models/Game.js'

const SALT_ROUNDS = 10

export const createTestUser = async (userData = {}) => {
    const hashedPassword = userData.password
        ? await bcrypt.hash(userData.password, SALT_ROUNDS)
        : await bcrypt.hash('Test123!', SALT_ROUNDS)

    const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        ...userData,
        ...(userData.password && { password: hashedPassword })
    })

    try {
        return await user.save()
    } catch (error) {
        console.error('Error creating test user:', error)
        throw error
    }
}

export const createTestGame = async (gameData = {}) => {
    const game = new Game({
        id: 999,
        name: 'Test Game',
        description: 'Test Description',
        image: '/images/test.jpg',
        ...gameData
    })

    try {
        return await game.save()
    } catch (error) {
        console.error('Error creating test game:', error)
        throw error
    }
}

export const clearDatabase = async () => {
    try {
        await Promise.all([
            User.deleteMany({}),
            Game.deleteMany({})
        ])
    } catch (error) {
        console.error('Error clearing database:', error)
        throw error
    }
}

export const getTestUserCredentials = () => ({
    email: 'test@example.com',
    password: 'Test123!'
})