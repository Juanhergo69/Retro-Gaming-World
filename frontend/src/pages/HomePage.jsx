import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useNavigate } from 'react-router-dom'
import { fetchAllGames, fetchGameDetails } from '../logic/gamesAPI'
import Avatar from '../components/ui/Avatar'
import GameCard from '../components/GameCard'
import Button from '../components/ui/Button'

function HomePage() {
    const { user, logout } = useAuth()
    const { favoriteGames } = useFavorites()
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [error, setError] = useState()
    const [selectedGameId, setSelectedGameId] = useState(null)
    const [showSettingsMenu, setShowSettingsMenu] = useState(false)
    const [displayMode, setDisplayMode] = useState(null)

    useEffect(() => {
        const loadGames = async () => {
            try {
                const gamesData = await fetchAllGames()
                setGames(gamesData)
                setError(null)
            } catch (err) {
                console.error('Error loading games:', err)
                setError('Failed to load games. Please try again later.')
                setGames([])
            }
        }

        loadGames()
    }, [])

    const handleLogout = () => {
        logout()
    }

    const toggleSettingsMenu = () => {
        setShowSettingsMenu(!showSettingsMenu)
    }

    const handleGameSelect = async (gameId, mode) => {
        if (!gameId || !mode) {
            setSelectedGameId(null)
            setDisplayMode(null)
            return
        }

        try {
            const updatedGame = await fetchGameDetails(gameId)
            setGames(prevGames =>
                prevGames.map(game =>
                    game.id === updatedGame.id ? updatedGame : game
                )
            )
            setSelectedGameId(updatedGame.id)
            setDisplayMode(mode)
            setError(null)
        } catch (error) {
            console.error('Error loading game:', error)
            setError('Failed to load game data. Please try again.')
            const localGame = games.find(game => game.id === gameId)
            if (localGame) {
                setSelectedGameId(localGame.id)
                setDisplayMode(mode)
            }
        }
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
                            Welcome, {user?.username}!
                        </h1>
                    </div>

                    <div className="relative">
                        <Button
                            onClick={toggleSettingsMenu}
                            variant="secondary"
                            className="font-retro flex items-center gap-1 px-3 py-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="sr-only md:not-sr-only">SETTINGS</span>
                        </Button>

                        {showSettingsMenu && (
                            <div
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-retro-lg py-1 z-50 border-2 border-retro-gray"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button
                                    onClick={() => {
                                        navigate('/profile')
                                        setShowSettingsMenu(false)
                                    }}
                                    variant="menu"
                                    className="w-full text-left px-4 py-2 font-retro hover:bg-retro-purple/10 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    PROFILE
                                </Button>
                                <Button
                                    onClick={() => {
                                        navigate('/favorites')
                                        setShowSettingsMenu(false)
                                    }}
                                    variant="menu"
                                    className="w-full text-left px-4 py-2 font-retro hover:bg-retro-purple/10 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    FAVS
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleLogout()
                                        setShowSettingsMenu(false)
                                    }}
                                    variant="menu-danger"
                                    className="w-full text-left px-4 py-2 font-retro hover:bg-retro-pink/10 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    LOGOUT
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {error && (
                    <div className="mb-4 p-4 bg-retro-pink/20 text-retro-yellow border border-retro-pink rounded">
                        {error}
                    </div>
                )}

                <div className="mb-12">
                    <h2 className="text-retro-yellow font-retro text-2xl mb-4">
                        Every pixel echoes a legend
                    </h2>
                    {favoriteGames.length > 0 && (
                        <p className="text-retro-green font-retro text-sm">
                            You have {favoriteGames.length} favorite game{favoriteGames.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <section className="mb-12">
                    <h2 className="text-retro-green font-retro text-2xl mb-6">
                        Available Games
                    </h2>
                    {games.length === 0 ? (
                        <p className="text-retro-gray">No games available</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                            {games.map(game => (
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
                    )}
                </section>
            </div>
        </div>
    )
}

export default HomePage