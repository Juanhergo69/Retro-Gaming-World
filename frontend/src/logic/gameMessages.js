import api from '../api/axiosConfig'

export const fetchGameMessages = async (gameId) => {
    try {
        const response = await api.get(`/games/${gameId}`)
        return Array.isArray(response.data.messages) ? response.data.messages : []
    } catch (error) {
        console.error('Error loading messages:', error)
        return []
    }
}

export const postGameMessage = async (gameId, messageData) => {
    try {
        const response = await api.post(`/games/${gameId}/messages`, {
            ...messageData,
            userId: messageData.userId.toString()
        })
        return response.data.messages || []
    } catch (error) {
        console.error('Error saving message:', error)
        throw error
    }
}

export const deleteGameMessage = async (gameId, userId, timestamp) => {
    try {
        const response = await api.delete(`/games/${gameId}/messages`, {
            data: {
                userId: userId.toString(),
                timestamp
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    } catch (error) {
        console.error('Delete error:', error)
        throw error
    }
}