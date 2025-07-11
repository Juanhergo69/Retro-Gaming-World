import express from 'express'
const router = express.Router()
import * as userHandler from '../handlers/userHandler.js'
import { authenticate } from '../middleware/auth.js'

router.get('/:id', authenticate, userHandler.getUserById)
router.put('/:id', authenticate, userHandler.updateUser)
router.delete('/:id', authenticate, userHandler.deleteUser)
router.post('/favorites/add', authenticate, userHandler.addFavorite)
router.post('/favorites/remove', authenticate, userHandler.removeFavorite)
router.get('/:id/favorites', authenticate, userHandler.getUserFavorites)

export default router

