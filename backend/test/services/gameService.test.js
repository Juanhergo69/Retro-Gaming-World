import { expect } from 'chai'
import * as gameService from '../../services/gameService.js'
import { createTestUser, createTestGame, clearDatabase } from '../utils.js'
import { GameNotFoundError, MessageNotFoundError } from 'common'

describe('GameService', () => {
    let testUser
    let testGame

    beforeEach(async () => {
        await clearDatabase()
        testUser = await createTestUser()
        testGame = await createTestGame()
    })

    describe('getAllGames()', () => {
        it('should return all games', async () => {
            const games = await gameService.getAllGames()
            expect(games).to.be.an('array')
            expect(games.length).to.be.at.least(1)
        })
    })

    describe('getGameById()', () => {
        it('should return game by id', async () => {
            const game = await gameService.getGameById(testGame.id)
            expect(game).to.be.an('object')
            expect(game.id).to.equal(testGame.id)
        })

        it('should throw GameNotFoundError for non-existent id', async () => {
            try {
                await gameService.getGameById(9999)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(GameNotFoundError)
            }
        })
    })

    describe('toggleInteraction()', () => {
        it('should add like to game', async () => {
            const game = await gameService.toggleInteraction(
                testGame.id,
                testUser._id.toString(),
                'likes',
                'dislikes'
            )
            expect(game.likes).to.include(testUser._id)
        })

        it('should remove like if already liked', async () => {
            await gameService.toggleInteraction(
                testGame.id,
                testUser._id.toString(),
                'likes',
                'dislikes'
            )

            const game = await gameService.toggleInteraction(
                testGame.id,
                testUser._id.toString(),
                'likes',
                'dislikes'
            )
            expect(game.likes).to.not.include(testUser._id)
        })

        it('should remove dislike when adding like', async () => {
            await gameService.toggleInteraction(
                testGame.id,
                testUser._id.toString(),
                'dislikes',
                'likes'
            )

            const game = await gameService.toggleInteraction(
                testGame.id,
                testUser._id.toString(),
                'likes',
                'dislikes'
            )
            expect(game.likes).to.include(testUser._id)
            expect(game.dislikes).to.not.include(testUser._id)
        })

        it('should throw GameNotFoundError for non-existent game', async () => {
            try {
                await gameService.toggleInteraction(
                    9999,
                    testUser._id.toString(),
                    'likes',
                    'dislikes'
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(GameNotFoundError)
            }
        })
    })

    describe('addMessage()', () => {
        it('should add message to game', async () => {
            const message = {
                userId: testUser._id.toString(),
                text: 'Test message',
                timestamp: new Date().toISOString()
            }

            const game = await gameService.addMessage(testGame.id, message)
            expect(game.messages).to.have.lengthOf(1)
            expect(game.messages[0].text).to.equal(message.text)
        })

        it('should throw GameNotFoundError for non-existent game', async () => {
            try {
                await gameService.addMessage(9999, {
                    userId: testUser._id.toString(),
                    text: 'Test message',
                    timestamp: new Date().toISOString()
                })
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(GameNotFoundError)
            }
        })
    })

    describe('deleteMessage()', () => {
        it('should delete message from game', async () => {
            const timestamp = new Date().toISOString()
            const message = {
                userId: testUser._id.toString(),
                text: 'Test message',
                timestamp
            }

            await gameService.addMessage(testGame.id, message)

            const game = await gameService.deleteMessage(
                testGame.id,
                testUser._id.toString(),
                timestamp
            )
            expect(game.messages).to.have.lengthOf(0)
        })

        it('should throw GameNotFoundError for non-existent game', async () => {
            try {
                await gameService.deleteMessage(
                    9999,
                    testUser._id.toString(),
                    new Date().toISOString()
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(GameNotFoundError)
            }
        })

        it('should throw MessageNotFoundError for non-existent message', async () => {
            try {
                await gameService.deleteMessage(
                    testGame.id,
                    testUser._id.toString(),
                    new Date().toISOString()
                )
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(MessageNotFoundError)
            }
        })
    })

    describe('updateHighscore()', () => {
        it('should add new highscore', async () => {
            const game = await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                1000
            )
            expect(game.highscores).to.have.lengthOf(1)
            expect(game.highscores[0].score).to.equal(1000)
        })

        it('should update existing highscore if higher', async () => {
            await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                1000
            )

            const game = await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                1500
            )
            expect(game.highscores).to.have.lengthOf(1)
            expect(game.highscores[0].score).to.equal(1500)
        })

        it('should not update existing highscore if lower', async () => {
            await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                1000
            )

            const game = await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                500
            )
            expect(game.highscores).to.have.lengthOf(1)
            expect(game.highscores[0].score).to.equal(1000)
        })

        it('should limit highscores to top 10', async () => {
            for (let i = 1; i <= 11; i++) {
                const user = await createTestUser({ email: `user${i}@example.com`, username: `user${i}` })
                await gameService.updateHighscore(
                    testGame.id,
                    user._id.toString(),
                    i * 100
                )
            }

            const game = await gameService.getGameById(testGame.id)
            expect(game.highscores).to.have.lengthOf(10)
            expect(game.highscores[0].score).to.equal(1100)
            expect(game.highscores[9].score).to.equal(200)
        })
    })

    describe('getUserHighScore()', () => {
        it('should return user high score', async () => {
            await gameService.updateHighscore(
                testGame.id,
                testUser._id.toString(),
                1000
            )

            const highScore = await gameService.getUserHighScore(
                testGame.id,
                testUser._id.toString()
            )
            expect(highScore).to.equal(1000)
        })

        it('should return 0 if user has no high score', async () => {
            const highScore = await gameService.getUserHighScore(
                testGame.id,
                testUser._id.toString()
            )
            expect(highScore).to.equal(0)
        })
    })
})