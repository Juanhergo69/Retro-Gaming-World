import { expect } from 'chai'
import User from '../../models/User.js'
import * as userRepository from '../../data/userRepository.js'
import { UserNotFoundError } from 'common'
import { createTestUser, clearDatabase } from '../utils.js'

describe('UserRepository', () => {
    let testUser

    beforeEach(async () => {
        await clearDatabase()
        testUser = await createTestUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test123!'
        })
    })

    describe('findUserById', () => {
        it('should return user when found', async () => {
            const result = await userRepository.findUserById(testUser._id)

            expect(result).to.be.an('object')
            expect(result._id.toString()).to.equal(testUser._id.toString())
            expect(result.username).to.equal(testUser.username)
        })

        it('should throw UserNotFoundError when user not found', async () => {
            const nonExistentId = '5f8d0d55b54764421b715d00'

            try {
                await userRepository.findUserById(nonExistentId)
                expect.fail('Expected error was not thrown')
            } catch (error) {
                expect(error).to.be.instanceOf(UserNotFoundError)
            }
        })
    })

    describe('findUserByEmail', () => {
        it('should return user when found by email', async () => {
            const result = await userRepository.findUserByEmail(testUser.email)

            expect(result).to.be.an('object')
            expect(result._id.toString()).to.equal(testUser._id.toString())
            expect(result.email).to.equal(testUser.email)
        })

        it('should return null when user not found by email', async () => {
            const result = await userRepository.findUserByEmail('nonexistent@example.com')
            expect(result).to.be.null
        })
    })

    describe('findUserByUsername', () => {
        it('should return user when found by username', async () => {
            const result = await userRepository.findUserByUsername(testUser.username)

            expect(result).to.be.an('object')
            expect(result._id.toString()).to.equal(testUser._id.toString())
            expect(result.username).to.equal(testUser.username)
        })

        it('should return null when user not found by username', async () => {
            const result = await userRepository.findUserByUsername('nonexistentuser')
            expect(result).to.be.null
        })
    })

    describe('createUser', () => {
        it('should create and return new user', async () => {
            const newUserData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'NewPassword123!'
            }

            const result = await userRepository.createUser(newUserData)

            expect(result).to.be.an('object')
            expect(result.username).to.equal(newUserData.username)
            expect(result.email).to.equal(newUserData.email)

            const dbUser = await User.findById(result._id)
            expect(dbUser).to.not.be.null
            expect(dbUser.username).to.equal(newUserData.username)
        })
    })

    describe('updateUser', () => {
        it('should update and return user', async () => {
            const updates = { username: 'updateduser' }

            const result = await userRepository.updateUser(testUser._id, updates)

            expect(result).to.be.an('object')
            expect(result._id.toString()).to.equal(testUser._id.toString())
            expect(result.username).to.equal(updates.username)

            const dbUser = await User.findById(testUser._id)
            expect(dbUser.username).to.equal(updates.username)
        })

        it('should throw UserNotFoundError when updating non-existent user', async () => {
            const nonExistentId = '5f8d0d55b54764421b715d00'
            const updates = { username: 'updateduser' }

            try {
                await userRepository.updateUser(nonExistentId, updates)
                expect.fail('Expected error was not thrown')
            } catch (error) {
                expect(error).to.be.instanceOf(UserNotFoundError)
            }
        })
    })
})