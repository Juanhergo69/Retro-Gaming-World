import * as userService from '../services/userService.js'
import * as authService from '../services/authService.js'
import { RequiredFieldsError, InvalidPasswordError } from 'common'

export const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id)
        const userObj = user.toObject()
        userObj.id = user._id.toString()
        delete userObj._id
        delete userObj.password
        res.json(userObj)
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params
        const currentUserId = req.user.id
        const updates = req.body

        if (updates.newPassword) {
            if (!updates.currentPassword) {
                throw new RequiredFieldsError('Current password is required')
            }

            const user = await userService.getUserById(id)
            const isMatch = await authService.comparePasswords(
                updates.currentPassword,
                user.password
            )

            if (!isMatch) {
                throw new InvalidPasswordError('Current password is incorrect')
            }

            updates.password = updates.newPassword
            delete updates.currentPassword
            delete updates.newPassword
        }

        const updatedUser = await userService.updateUser(id, updates, currentUserId)
        const userObj = updatedUser.toObject()
        userObj.id = updatedUser._id.toString()
        delete userObj._id
        delete userObj.password
        res.json(userObj)
    } catch (error) {
        next(error)
    }
}

export const addFavorite = async (req, res, next) => {
    try {
        const { userId, gameId } = req.body
        const currentUserId = req.user.id

        if (!userId || !gameId) {
            throw new RequiredFieldsError('userId and gameId are required')
        }

        const updatedUser = await userService.addUserFavorite(
            userId,
            parseInt(gameId),
            currentUserId
        )

        res.json({
            success: true,
            favorites: updatedUser.favorites
        })
    } catch (error) {
        next(error)
    }
}

export const removeFavorite = async (req, res, next) => {
    try {
        const { userId, gameId } = req.body
        const currentUserId = req.user.id

        if (!userId || !gameId) {
            throw new RequiredFieldsError('userId and gameId are required')
        }

        const updatedUser = await userService.removeUserFavorite(
            userId,
            parseInt(gameId),
            currentUserId
        )

        res.json({
            success: true,
            favorites: updatedUser.favorites
        })
    } catch (error) {
        next(error)
    }
}

export const getUserFavorites = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id)
        res.json(user.favorites || [])
    } catch (error) {
        next(error)
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params
        const currentUserId = req.user.id

        await userService.deleteUser(id, currentUserId)

        res.clearCookie('token')
        res.status(204).end()
    } catch (error) {
        next(error)
    }
}
