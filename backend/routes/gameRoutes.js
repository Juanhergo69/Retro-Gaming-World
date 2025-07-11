import express from 'express'
const router = express.Router()
import * as gameHandler from '../handlers/gameHandler.js'

router.get('/', gameHandler.getAllGames)
router.get('/:id', gameHandler.getGameById)
router.post('/:id/like', gameHandler.likeGame)
router.post('/:id/dislike', gameHandler.dislikeGame)
router.post('/:id/messages', gameHandler.addMessage)
router.delete('/:gameId/messages', gameHandler.deleteMessage)
router.post('/:id/scores', gameHandler.submitScore)
router.get('/:id/scores/:userId', gameHandler.getUserHighScore)

export default router