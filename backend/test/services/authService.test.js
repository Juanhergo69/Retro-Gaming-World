import { expect } from 'chai'
import bcrypt from 'bcrypt'
import * as authService from '../../services/authService.js'
import {
    createTestUser,
    clearDatabase,
    getTestUserCredentials
} from '../utils.js'
import {
    RequiredFieldsError,
    PasswordsDontMatchError,
    InvalidEmailError,
    InvalidPasswordError,
    EmailInUseError,
    UsernameTakenError,
    UnauthorizedError,
    ValidationError
} from 'common'

describe('AuthService', () => {
    beforeEach(async () => {
        await clearDatabase()
    })

    describe('register()', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'Test123!',
                confirmPassword: 'Test123!'
            }

            const user = await authService.register(userData)
            expect(user).to.be.an('object')
            expect(user.username).to.equal(userData.username)
            expect(user.email).to.equal(userData.email)
            expect(user.password).to.not.equal(userData.password)
        })

        it('should throw RequiredFieldsError when missing fields', async () => {
            const userData = {
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(RequiredFieldsError)
            }
        })

        it('should throw PasswordsDontMatchError when passwords dont match', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'Test123!',
                confirmPassword: 'Different123!'
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(PasswordsDontMatchError)
            }
        })

        it('should throw InvalidEmailError with invalid email', async () => {
            const userData = {
                username: 'newuser',
                email: 'invalid-email',
                password: 'Test123!',
                confirmPassword: 'Test123!'
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(InvalidEmailError)
            }
        })

        it('should throw InvalidPasswordError with weak password', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'weak',
                confirmPassword: 'weak'
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(InvalidPasswordError)
            }
        })

        it('should throw EmailInUseError with duplicate email', async () => {
            await createTestUser({ email: 'duplicate@example.com' })

            const userData = {
                username: 'newuser',
                email: 'duplicate@example.com',
                password: 'Test123!',
                confirmPassword: 'Test123!'
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(EmailInUseError)
            }
        })

        it('should throw UsernameTakenError with duplicate username', async () => {
            await createTestUser({ username: 'duplicateuser' })

            const userData = {
                username: 'duplicateuser',
                email: 'new@example.com',
                password: 'Test123!',
                confirmPassword: 'Test123!'
            }

            try {
                await authService.register(userData)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UsernameTakenError)
            }
        })
    })

    describe('login()', () => {
        const testCredentials = getTestUserCredentials()

        beforeEach(async () => {
            await createTestUser({
                username: 'loginuser',
                email: testCredentials.email,
                password: testCredentials.password
            })
        })

        it('should login with valid credentials', async () => {
            const user = await authService.login(testCredentials.email, testCredentials.password)
            expect(user).to.be.an('object')
            expect(user.email).to.equal(testCredentials.email)
            expect(user).to.have.property('username')
            expect(user).to.have.property('_id')
        })

        it('should throw ValidationError when missing fields', async () => {
            try {
                await authService.login('', '')
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError)
                expect(error.message).to.equal('Email and password are required')
            }
        })

        it('should throw UnauthorizedError with non-existent email', async () => {
            try {
                await authService.login('nonexistent@example.com', testCredentials.password)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UnauthorizedError)
                expect(error.message).to.equal('Account not found')
            }
        })

        it('should throw UnauthorizedError with incorrect password', async () => {
            try {
                await authService.login(testCredentials.email, 'Wrong123!')
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UnauthorizedError)
                expect(error.message).to.equal('Incorrect password')
            }
        })

        it('should handle bcrypt comparison errors', async () => {
            const originalCompare = bcrypt.compare
            bcrypt.compare = () => Promise.reject(new Error('bcrypt error'))

            try {
                await authService.login(testCredentials.email, testCredentials.password)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(Error)
                expect(error.message).to.equal('bcrypt error')
            } finally {
                bcrypt.compare = originalCompare
            }
        })

        it('should remove sensitive data from returned user', async () => {
            const user = await authService.login(testCredentials.email, testCredentials.password)
            const userObj = user.toObject()
            userObj.id = user._id.toString()
            delete userObj._id
            delete userObj.password

            expect(userObj).to.be.an('object')
            expect(userObj).to.not.have.property('password')
            expect(userObj).to.not.have.property('_id')
            expect(userObj).to.have.property('id')
            expect(userObj).to.have.property('email')
            expect(userObj).to.have.property('username')
        })
    })

    describe('comparePasswords()', () => {
        it('should return true for matching passwords', async () => {
            const plainPassword = 'Test123!'
            const hashedPassword = await bcrypt.hash(plainPassword, 10)
            const result = await authService.comparePasswords(plainPassword, hashedPassword)
            expect(result).to.be.true
        })

        it('should return false for non-matching passwords', async () => {
            const plainPassword = 'Test123!'
            const wrongPassword = 'Wrong123!'
            const hashedPassword = await bcrypt.hash(plainPassword, 10)
            const result = await authService.comparePasswords(wrongPassword, hashedPassword)
            expect(result).to.be.false
        })
    })
})