import express from 'express'
const router = express.Router()
import * as authController from '../handlers/authHandler.js'
import { authenticate } from '../middleware/auth.js'

router.get('/me', authenticate, authController.getCurrentUser)
router.post('/register', authController.register)
router.post('/login', authController.login)

export default router