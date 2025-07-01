import api from '../api/axiosConfig'

export const fetchAllGames = async () => {
    try {
        const response = await api.get('/games')
        return response.data
    } catch (error) {
        console.error('Error loading games:', error)
        throw error
    }
}

export const fetchGameDetails = async (gameId) => {
    try {
        const response = await api.get(`/games/${gameId}`)
        return response.data
    } catch (error) {
        console.error('Error loading game details:', error)
        throw error
    }
}