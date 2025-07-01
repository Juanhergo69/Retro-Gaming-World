import User from '../models/User.js'
import Game from '../models/Game.js'
import bcrypt from 'bcrypt'
import {
    UserNotFoundError,
    UsernameTakenError,
    EmailInUseError,
    ForbiddenError,
    InvalidPasswordError
} from 'common'

export const getUserById = async (id) => {
    const user = await User.findById(id)
    if (!user) throw new UserNotFoundError()
    return user
}

export const updateUser = async (id, updates, currentUserId) => {
    if (id !== currentUserId) throw new ForbiddenError()

    const user = await User.findById(id)
    if (!user) throw new UserNotFoundError()

    if (updates.username && updates.username !== user.username) {
        const existingUser = await User.findOne({ username: updates.username })
        if (existingUser) throw new UsernameTakenError()
    }

    if (updates.email && updates.email !== user.email) {
        const existingUser = await User.findOne({ email: updates.email })
        if (existingUser) throw new EmailInUseError()
    }

    if (updates.password) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/
        if (!passwordRegex.test(updates.password)) {
            throw new InvalidPasswordError()
        }
        updates.password = await bcrypt.hash(updates.password, 10)
    }

    Object.assign(user, updates)
    await user.save()

    return user
}

export const addUserFavorite = async (userId, gameId, currentUserId) => {
    if (userId !== currentUserId) throw new ForbiddenError()

    const user = await User.findById(userId)
    if (!user) throw new UserNotFoundError()

    if (!user.favorites.includes(gameId)) {
        user.favorites.push(gameId)
        await user.save()
    }

    const userObj = user.toObject()
    userObj.id = user._id.toString()
    delete userObj._id
    delete userObj.password

    return userObj
}

export const removeUserFavorite = async (userId, gameId, currentUserId) => {
    if (userId !== currentUserId) throw new ForbiddenError()

    const user = await User.findById(userId)
    if (!user) throw new UserNotFoundError()

    user.favorites = user.favorites.filter(id => id !== gameId)
    await user.save()

    const userObj = user.toObject()
    userObj.id = user._id.toString()
    delete userObj._id
    delete userObj.password

    return userObj
}

export const deleteUser = async (id, currentUserId) => {
    if (id !== currentUserId) throw new ForbiddenError()

    const user = await User.findByIdAndDelete(id)
    if (!user) throw new UserNotFoundError()

    await Game.updateMany(
        {},
        {
            $pull: {
                likes: user._id,
                dislikes: user._id,
                highscores: { user: user._id },
                messages: { user: user._id }
            }
        }
    )
}


