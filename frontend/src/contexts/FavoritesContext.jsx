import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserFavorites, addUserFavorite, removeUserFavorite } from '../logic/favoritesAPI'

const FavoritesContext = createContext()

export function FavoritesProvider({ children }) {
    const { user } = useAuth()
    const [favoriteGames, setFavoriteGames] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshFavorites = async () => {
        if (!user) {
            setFavoriteGames([])
            return
        }

        try {
            const favorites = await fetchUserFavorites(user.id)
            setFavoriteGames(favorites)
        } catch (error) {
            console.error("Error refreshing favorites:", error)
            setFavoriteGames([])
        }
    }

    const addFavorite = async (gameId) => {
        if (!user) return false

        try {
            const updatedFavorites = await addUserFavorite(user.id, gameId)
            setFavoriteGames(updatedFavorites)
            return true
        } catch (error) {
            console.error("Error adding favorite:", error)
            await refreshFavorites()
            return false
        }
    }

    const removeFavorite = async (gameId) => {
        if (!user) return false

        try {
            const updatedFavorites = await removeUserFavorite(user.id, gameId)
            setFavoriteGames(updatedFavorites)
            return true
        } catch (error) {
            console.error("Error removing favorite:", error)
            await refreshFavorites()
            return false
        }
    }

    const toggleFavorite = async (gameId) => {
        return isFavorite(gameId)
            ? await removeFavorite(gameId)
            : await addFavorite(gameId)
    }

    const isFavorite = (gameId) => {
        return favoriteGames.includes(gameId)
    }

    useEffect(() => {
        const initialize = async () => {
            await refreshFavorites()
            setIsLoading(false)
        }
        initialize()
    }, [user])

    return (
        <FavoritesContext.Provider value={{
            favoriteGames,
            refreshFavorites,
            addFavorite,
            removeFavorite,
            toggleFavorite,
            isFavorite,
            isLoading
        }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    return useContext(FavoritesContext)
}