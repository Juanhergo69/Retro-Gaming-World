import jwt from 'jsonwebtoken'
import { findUserById } from '../data/userRepository.js'

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) return res.status(401).json({ message: 'Authentication required' })

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        const user = await findUserById(decoded.userId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        req.user = {
            id: user._id.toString(),
            ...user.toObject()
        }
        delete req.user._id
        delete req.user.password

        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}
