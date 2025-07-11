import api from '../api/axiosConfig'
import { getErrorMessage } from 'common'

export const fetchUserFavorites = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/favorites`)
        return Array.isArray(response.data) ? response.data : []
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const addUserFavorite = async (userId, gameId) => {
    try {
        const response = await api.post('/users/favorites/add', {
            userId: userId.toString(),
            gameId
        })
        return response.data.favorites || []
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const removeUserFavorite = async (userId, gameId) => {
    try {
        const response = await api.post('/users/favorites/remove', {
            userId: userId.toString(),
            gameId
        })
        return response.data.favorites || []
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}
