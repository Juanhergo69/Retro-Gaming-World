import api from '../api/axiosConfig'

export const fetchGameHighscores = async (gameId) => {
    try {
        const response = await api.get(`/games/${gameId}`)
        return Array.isArray(response.data.highscores) ? response.data.highscores : []
    } catch (error) {
        console.error('Error loading highscores:', error)
        return []
    }
}