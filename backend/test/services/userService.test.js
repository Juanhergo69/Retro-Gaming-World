import { expect } from 'chai'
import * as userService from '../../services/userService.js'
import Game from '../../models/Game.js'
import { createTestUser, clearDatabase, createTestGame } from '../utils.js'
import {
    UserNotFoundError,
    UsernameTakenError,
    EmailInUseError,
    ForbiddenError,
    InvalidPasswordError
} from 'common'

describe('UserService', () => {
    let testUser

    beforeEach(async () => {
        await clearDatabase()
        testUser = await createTestUser()
    })

    describe('getUserById()', () => {
        it('should return user by id', async () => {
            const user = await userService.getUserById(testUser._id.toString())
            expect(user).to.be.an('object')
            expect(user._id.toString()).to.equal(testUser._id.toString())
        })

        it('should throw UserNotFoundError for non-existent id', async () => {
            try {
                await userService.getUserById('507f1f77bcf86cd799439011')
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UserNotFoundError)
            }
        })
    })

    describe('updateUser()', () => {
        it('should update user with valid data', async () => {
            const updates = {
                username: 'updateduser',
                avatar: 'new-avatar.jpg'
            }

            const updatedUser = await userService.updateUser(
                testUser._id.toString(),
                updates,
                testUser._id.toString()
            )
            expect(updatedUser.username).to.equal(updates.username)
            expect(updatedUser.avatar).to.equal(updates.avatar)
        })

        it('should update password with valid current password', async () => {
            const originalPassword = testUser.password
            const updates = {
                password: 'NewValid123!'
            }

            const updatedUser = await userService.updateUser(
                testUser._id.toString(),
                updates,
                testUser._id.toString()
            )
            expect(updatedUser.password).to.not.equal(originalPassword)
        })

        it('should throw ForbiddenError when updating another user', async () => {
            try {
                await userService.updateUser(
                    testUser._id.toString(),
                    { username: 'updateduser' },
                    'anotheruserid'
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(ForbiddenError)
            }
        })

        it('should throw UsernameTakenError with duplicate username', async () => {
            const anotherUser = await createTestUser({
                email: 'another@example.com',
                username: 'anotheruser'
            })

            try {
                await userService.updateUser(
                    testUser._id.toString(),
                    { username: 'anotheruser' },
                    testUser._id.toString()
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UsernameTakenError)
            }
        })

        it('should throw EmailInUseError with duplicate email', async () => {
            const anotherUser = await createTestUser({
                email: 'another@example.com',
                username: 'anotheruser'
            })

            try {
                await userService.updateUser(
                    testUser._id.toString(),
                    { email: 'another@example.com' },
                    testUser._id.toString()
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(EmailInUseError)
            }
        })

        it('should throw InvalidPasswordError with weak new password', async () => {
            const updates = {
                password: 'weak'
            }

            try {
                await userService.updateUser(
                    testUser._id.toString(),
                    updates,
                    testUser._id.toString()
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(InvalidPasswordError)
            }
        })
    })

    describe('addUserFavorite()', () => {
        it('should add game to user favorites', async () => {
            const updatedUser = await userService.addUserFavorite(
                testUser._id.toString(),
                123,
                testUser._id.toString()
            )
            expect(updatedUser.favorites).to.include(123)
        })

        it('should throw ForbiddenError when updating another user', async () => {
            try {
                await userService.addUserFavorite(
                    testUser._id.toString(),
                    123,
                    'anotheruserid'
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(ForbiddenError)
            }
            it('should not add duplicate game to user favorites', async () => {
                await userService.addUserFavorite(
                    testUser._id.toString(),
                    123,
                    testUser._id.toString()
                )

                const updatedUser = await userService.addUserFavorite(
                    testUser._id.toString(),
                    123,
                    testUser._id.toString()
                )

                const count = updatedUser.favorites.filter(id => id === 123).length
                expect(count).to.equal(1)
            })
        })
    })

    describe('removeUserFavorite()', () => {
        it('should remove game from user favorites', async () => {
            await userService.addUserFavorite(
                testUser._id.toString(),
                123,
                testUser._id.toString()
            )

            const updatedUser = await userService.removeUserFavorite(
                testUser._id.toString(),
                123,
                testUser._id.toString()
            )
            expect(updatedUser.favorites).to.not.include(123)
        })

        it('should throw ForbiddenError when updating another user', async () => {
            try {
                await userService.removeUserFavorite(
                    testUser._id.toString(),
                    123,
                    'anotheruserid'
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(ForbiddenError)
            }
        })
    })

    describe('deleteUser()', () => {
        it('should delete user', async () => {
            await userService.deleteUser(
                testUser._id.toString(),
                testUser._id.toString()
            )

            try {
                await userService.getUserById(testUser._id.toString())
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(UserNotFoundError)
            }
        })

        it('should throw ForbiddenError when deleting another user', async () => {
            try {
                await userService.deleteUser(
                    testUser._id.toString(),
                    'anotheruserid'
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(ForbiddenError)
            }
        })

        it('should remove user references from games when deleted', async () => {
            const game = await createTestGame({
                likes: [testUser._id],
                dislikes: [testUser._id],
                highscores: [{ user: testUser._id, score: 100 }],
                messages: [{
                    user: testUser._id,
                    text: 'Test message',
                }]
            })

            await userService.deleteUser(
                testUser._id.toString(),
                testUser._id.toString()
            )

            const updatedGame = await Game.findById(game._id)

            expect(updatedGame.likes).to.be.an('array').that.is.empty
            expect(updatedGame.dislikes).to.be.an('array').that.is.empty
            expect(updatedGame.highscores).to.be.an('array').that.is.empty
            expect(updatedGame.messages).to.be.an('array').that.is.empty
        })
    })
})