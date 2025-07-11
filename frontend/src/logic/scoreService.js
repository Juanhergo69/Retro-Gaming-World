import api from '../api/axiosConfig'
import { getErrorMessage } from 'common'

export const submitScore = async (userId, gameId, score, userData = {}) => {
    try {
        const response = await api.post(`/games/${gameId}/scores`, {
            userId: userId.toString(),
            score: parseInt(score),
            username: userData.username || 'Anonymous',
            avatar: userData.avatar || null
        })
        return response.data
    } catch (error) {
        throw new Error(getErrorMessage(error))
    }
}

export const getHighScore = async (gameId, userId) => {
    try {
        const response = await api.get(`/games/${gameId}/scores/${userId.toString()}`)
        return response.data.highScore || 0
    } catch (error) {
        console.error('Error fetching high score:', error.response?.data || error.message)
        return 0
    }
}
