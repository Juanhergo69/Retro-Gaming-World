import User from '../models/User.js'
import { UserNotFoundError } from 'common'

export const findUserById = async (id) => {
    const user = await User.findById(id)
    if (!user) throw new UserNotFoundError()
    return user
}

export const findUserByEmail = async (email) => {
    return await User.findOne({ email })
}

export const findUserByUsername = async (username) => {
    return await User.findOne({ username })
}

export const createUser = async (userData) => {
    return await User.create(userData)
}

export const updateUser = async (id, updates) => {
    const user = await User.findByIdAndUpdate(id, updates, { new: true })
    if (!user) throw new UserNotFoundError()
    return user
}