import api from '../api/axiosConfig'
import {
    getErrorMessage,
    UsernameTakenError,
    EmailInUseError,
    InvalidPasswordError,
    UnauthorizedError,
    ForbiddenError,
    UserNotFoundError
} from 'common'

export const fetchUserProfile = async () => {
    try {
        const response = await api.get('/auth/me')
        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const updateUserProfile = async (userId, updates) => {
    try {
        const response = await api.put(`/users/${userId}`, updates)
        return response.data
    } catch (error) {
        if (error.response?.data?.errorCode === 'USERNAME_TAKEN') {
            throw new UsernameTakenError()
        }
        if (error.response?.data?.errorCode === 'EMAIL_IN_USE') {
            throw new EmailInUseError()
        }
        if (error.response?.data?.errorCode === 'INVALID_PASSWORD') {
            throw new InvalidPasswordError()
        }
        if (error.response?.data?.errorCode === 'UNAUTHORIZED') {
            throw new UnauthorizedError()
        }
        if (error.response?.data?.errorCode === 'FORBIDDEN') {
            throw new ForbiddenError()
        }
        if (error.response?.data?.errorCode === 'USER_NOT_FOUND') {
            throw new UserNotFoundError()
        }
        throw new Error(getErrorMessage(error))
    }
}

export const updateUserAvatar = async (userId, avatarData) => {
    try {
        const response = await api.put(`/users/${userId}`, { avatar: avatarData })
        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const deleteUserAccount = async (userId) => {
    try {
        await api.delete(`/users/${userId}`)
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}