import api from '../api/axiosConfig'

export const fetchUserData = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching user data:', error)
        return null
    }
}