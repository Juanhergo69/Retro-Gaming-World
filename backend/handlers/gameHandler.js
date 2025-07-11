import * as gameService from '../services/gameService.js'

export const getAllGames = async (req, res, next) => {
    try {
        const games = await gameService.getAllGames()
        const formattedGames = games.map(game => ({
            ...game.toObject(),
            id: game.id,
            likes: game.likes?.map(id => id.toString()) || [],
            dislikes: game.dislikes?.map(id => id.toString()) || [],
            highscores: game.highscores?.map(hs => ({
                userId: hs.user.toString(),
                score: hs.score
            })) || [],
            messages: game.messages?.map(msg => ({
                userId: msg.user.toString(),
                text: msg.text,
                timestamp: msg.timestamp
            })) || []
        }))
        res.json(formattedGames)
    } catch (error) {
        next(error)
    }
}

export const getGameById = async (req, res, next) => {
    try {
        const game = await gameService.getGameById(parseInt(req.params.id))
        const formattedGame = {
            ...game.toObject(),
            id: game.id,
            likes: game.likes?.map(id => id.toString()) || [],
            dislikes: game.dislikes?.map(id => id.toString()) || [],
            highscores: game.highscores?.map(hs => ({
                userId: hs.user.toString(),
                score: hs.score
            })) || [],
            messages: game.messages?.map(msg => ({
                userId: msg.user.toString(),
                text: msg.text,
                timestamp: msg.timestamp
            })) || []
        }
        res.json(formattedGame)
    } catch (error) {
        next(error)
    }
}

export const likeGame = async (req, res, next) => {
    try {
        const { userId } = req.body
        const game = await gameService.toggleInteraction(
            parseInt(req.params.id),
            userId,
            'likes',
            'dislikes'
        )
        res.json(game)
    } catch (error) {
        next(error)
    }
}

export const dislikeGame = async (req, res, next) => {
    try {
        const { userId } = req.body
        const game = await gameService.toggleInteraction(
            parseInt(req.params.id),
            userId,
            'dislikes',
            'likes'
        )
        res.json(game)
    } catch (error) {
        next(error)
    }
}

export const addMessage = async (req, res, next) => {
    try {
        const { userId, text } = req.body
        const game = await gameService.addMessage(parseInt(req.params.id), {
            userId,
            text,
            timestamp: new Date().toISOString()
        })
        res.json(game)
    } catch (error) {
        next(error)
    }
}

export const deleteMessage = async (req, res, next) => {
    try {
        const { userId, timestamp } = req.body
        const gameId = parseInt(req.params.gameId)

        if (!userId || !timestamp) {
            return res.status(400).json({
                success: false,
                message: 'User ID and timestamp are required'
            })
        }

        const game = await gameService.deleteMessage(gameId, userId, timestamp)
        res.json({
            success: true,
            message: 'Message deleted successfully',
            game
        })
    } catch (error) {
        next(error)
    }
}

export const submitScore = async (req, res, next) => {
    try {
        const { userId, score } = req.body
        const game = await gameService.updateHighscore(
            parseInt(req.params.id),
            userId,
            score
        )
        res.json(game)
    } catch (error) {
        next(error)
    }
}

export const getUserHighScore = async (req, res, next) => {
    try {
        const game = await gameService.getGameById(parseInt(req.params.id))
        const userScore = game.highscores.find(hs => hs.user.toString() === req.params.userId)
        const highScore = userScore ? userScore.score : 0
        res.json({ highScore })
    } catch (error) {
        next(error)
    }
}

