import api from '../api/axiosConfig'

export const likeGame = async (gameId, userId) => {
    try {
        const response = await api.post(`/games/${gameId}/like`, {
            userId: userId.toString()
        })
        return response.data
    } catch (error) {
        console.error('Error liking game:', error)
        throw error
    }
}