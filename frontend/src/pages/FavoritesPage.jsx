import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useNavigate } from 'react-router-dom'
import { fetchAllGames, fetchGameDetails } from '../logic/gamesAPI'
import Avatar from '../components/ui/Avatar'
import GameCard from '../components/GameCard'
import Button from '../components/ui/Button'

function FavoritesPage() {
    const { user } = useAuth()
    const { favoriteGames, refreshFavorites, isLoading: favoritesLoading } = useFavorites()
    const navigate = useNavigate()
    const [selectedGameId, setSelectedGameId] = useState(null)
    const [displayMode, setDisplayMode] = useState(null)
    const [allGames, setAllGames] = useState([])
    const [loadingGames, setLoadingGames] = useState(true)

    useEffect(() => {
        const loadGames = async () => {
            try {
                const games = await fetchAllGames()
                setAllGames(games)
            } catch (error) {
                console.error('Failed to load games:', error)
            } finally {
                setLoadingGames(false)
            }
        }

        loadGames()
    }, [refreshFavorites])

    const handleGameSelect = async (gameId, mode) => {
        if (!gameId || !mode) {
            setSelectedGameId(null)
            setDisplayMode(null)
            return
        }

        try {
            const currentGame = await fetchGameDetails(gameId)
            setAllGames(prevGames =>
                prevGames.map(game =>
                    game.id === currentGame.id ? currentGame : game
                )
            )
            setSelectedGameId(currentGame.id)
            setDisplayMode(mode)
        } catch (error) {
            console.error('Failed to load game details:', error)
            const localGame = allGames.find(game => game.id === gameId)
            if (localGame) {
                setSelectedGameId(localGame.id)
                setDisplayMode(mode)
            }
        }
    }

    const getCurrentFavorites = () => {
        return allGames.filter(game => favoriteGames.includes(game.id))
    }

    const currentFavorites = getCurrentFavorites()

    if (favoritesLoading || loadingGames) {
        return (
            <div className="min-h-screen bg-retro-dark p-4 flex items-center justify-center">
                <div className="text-retro-yellow font-retro">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-retro-dark p-4">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={user?.avatar}
                            alt={user?.username}
                            text={user?.username?.charAt(0).toUpperCase()}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-retro-yellow flex-shrink-0"
                        />
                        <h1 className="text-retro-pink font-retro text-2xl md:text-3xl">
                            Favorite Games
                        </h1>
                    </div>
                    <Button
                        onClick={() => navigate('/home')}
                        variant="secondary"
                        className="font-retro flex items-center gap-1 px-3 py-2"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="sr-only md:not-sr-only">HOME</span>
                    </Button>
                </header>

                {currentFavorites.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-retro-gray font-retro text-xl mb-4">
                            You haven't favorited any games yet!
                        </p>
                        <Button
                            onClick={() => navigate('/home')}
                            variant="primary"
                        >
                            Browse Games
                        </Button>
                    </div>
                ) : (
                    <section className="mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                            {currentFavorites.map(game => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    userId={user?.id}
                                    onSelect={handleGameSelect}
                                    isShowingScores={selectedGameId === game.id && displayMode === 'scores'}
                                    isShowingMessages={selectedGameId === game.id && displayMode === 'messages'}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

export default FavoritesPage