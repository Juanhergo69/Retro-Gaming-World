import Game from '../models/Game.js'
import mongoose from 'mongoose'
import {
    GameNotFoundError,
    MessageNotFoundError
} from 'common'

export const getAllGames = async () => {
    return await Game.find({})
}

export const getGameById = async (id) => {
    const game = await Game.findOne({ id })
    if (!game) throw new GameNotFoundError()
    return game
}

export const toggleInteraction = async (gameId, userId, interactionType, oppositeType) => {
    const game = await Game.findOne({ id: gameId })
    if (!game) throw new GameNotFoundError()

    const userIdObj = new mongoose.Types.ObjectId(userId)

    if (game[oppositeType].includes(userIdObj)) {
        await Game.updateOne(
            { id: gameId },
            { $pull: { [oppositeType]: userIdObj } }
        )
    }

    const operation = game[interactionType].includes(userIdObj) ? '$pull' : '$addToSet'
    await Game.updateOne(
        { id: gameId },
        { [operation]: { [interactionType]: userIdObj } }
    )

    return await Game.findOne({ id: gameId })
}

export const addMessage = async (gameId, message) => {
    const game = await Game.findOne({ id: gameId })
    if (!game) throw new GameNotFoundError()

    const newMessage = {
        user: new mongoose.Types.ObjectId(message.userId),
        text: message.text,
        timestamp: message.timestamp
    }

    await Game.updateOne(
        { id: gameId },
        { $push: { messages: newMessage } }
    )

    return await Game.findOne({ id: gameId })
}

export const deleteMessage = async (gameId, userId, timestamp) => {
    const game = await Game.findOne({ id: gameId })
    if (!game) throw new GameNotFoundError()

    const targetTime = new Date(timestamp).getTime()
    const messageIndex = game.messages.findIndex(msg => {
        const msgTime = new Date(msg.timestamp).getTime()
        return msg.user.toString() === userId && Math.abs(msgTime - targetTime) < 1000
    })

    if (messageIndex === -1) {
        throw new MessageNotFoundError()
    }

    game.messages.splice(messageIndex, 1)
    await game.save()

    return game
}

export const updateHighscore = async (gameId, userId, score) => {
    const game = await Game.findOne({ id: gameId })
    if (!game) throw new GameNotFoundError()

    const userIdObj = new mongoose.Types.ObjectId(userId)
    const existingScoreIndex = game.highscores.findIndex(hs => hs.user.equals(userIdObj))

    if (existingScoreIndex !== -1) {
        if (score > game.highscores[existingScoreIndex].score) {
            game.highscores[existingScoreIndex].score = score
        }
    } else {
        game.highscores.push({ user: userIdObj, score })
    }

    game.highscores.sort((a, b) => b.score - a.score)
    game.highscores = game.highscores.slice(0, 10)

    await game.save()
    return game
}

export const getUserHighScore = async (gameId, userId) => {
    const game = await Game.findOne({ id: gameId })
    if (!game) throw new GameNotFoundError()

    const userScore = game.highscores.find(hs => hs.user.toString() === userId)
    return userScore ? userScore.score : 0
}
