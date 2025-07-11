import jwt from 'jsonwebtoken'
import * as authService from '../services/authService.js'
import * as userRepository from '../data/userRepository.js'

export const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body)
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        )

        const userObj = user.toObject()
        userObj.id = user._id.toString()
        delete userObj._id
        delete userObj.password

        res.status(201).json({ token, user: userObj })
    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const user = await authService.login(email, password)
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        )

        const userObj = user.toObject()
        userObj.id = user._id.toString()
        delete userObj._id
        delete userObj.password

        res.json({ token, user: userObj })
    } catch (error) {
        next(error)
    }
}

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await userRepository.findUserById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const userObj = user.toObject()
        userObj.id = user._id.toString()
        delete userObj._id
        delete userObj.password

        res.json(userObj)
    } catch (error) {
        next(error)
    }
}


