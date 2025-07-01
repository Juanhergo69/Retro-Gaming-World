export const toggleGameFavorite = async (gameId, toggleFavorite) => {
    try {
        await toggleFavorite(gameId)
    } catch (error) {
        console.error('Error toggling favorite:', error)
        throw error
    }
}