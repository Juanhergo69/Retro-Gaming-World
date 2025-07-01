import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../contexts/FavoritesContext'
import { likeGame } from '../logic/gameLikes'
import { dislikeGame } from '../logic/gameDislikes'
import { toggleGameFavorite } from '../logic/gameFavorites'
import HighScores from './HighScores'
import Messages from './Messages'

function GameCard({ game, userId, onSelect, isShowingScores = false, isShowingMessages = false }) {
    const [localGame, setLocalGame] = useState(game)
    const navigate = useNavigate()
    const { toggleFavorite, isFavorite } = useFavorites()

    const userLiked = localGame.likes.includes(userId)
    const userDisliked = localGame.dislikes.includes(userId)
    const userFavorited = isFavorite(localGame.id)

    const handleLike = async (e) => {
        e.stopPropagation()
        try {
            const updatedGame = await likeGame(game.id, userId)
            setLocalGame(updatedGame)
        } catch (error) {
            console.error('Error liking game:', error)
        }
    }

    const handleDislike = async (e) => {
        e.stopPropagation()
        try {
            const updatedGame = await dislikeGame(game.id, userId)
            setLocalGame(updatedGame)
        } catch (error) {
            console.error('Error disliking game:', error)
        }
    }

    const handleFavorite = async (e) => {
        e.stopPropagation()
        try {
            await toggleGameFavorite(game.id, toggleFavorite)
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    const handlePlay = (e) => {
        e.stopPropagation()
        navigate(`/games/${localGame.id}`)
    }

    const handleScoresClick = (e) => {
        e.stopPropagation()
        onSelect(isShowingScores ? null : game.id, isShowingScores ? null : 'scores')
    }

    const handleMessagesClick = (e) => {
        e.stopPropagation()
        onSelect(isShowingMessages ? null : game.id, isShowingMessages ? null : 'messages')
    }

    return (
        <div className="flex flex-col">
            <div className="bg-white rounded-lg overflow-hidden shadow-retro hover:shadow-retro-lg transition-shadow cursor-pointer h-full">
                <div className="relative pt-[56.25%] bg-gray-100">
                    {localGame.image ? (
                        <img
                            src={localGame.image}
                            alt={localGame.name}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                            <span className="text-gray-500 font-retro text-xl">
                                {localGame.name}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <h3 className="font-retro text-retro-purple text-lg mb-2 truncate">
                        {localGame.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 h-12">
                        {localGame.description}
                    </p>
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-3">
                            <button
                                onClick={handleFavorite}
                                className={`flex items-center space-x-1 px-2 py-1 rounded ${userFavorited ? 'bg-retro-purple/10 text-retro-pink' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label={userFavorited ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill={userFavorited ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={handleLike}
                                className={`flex items-center space-x-1 px-2 py-1 rounded ${userLiked ? 'bg-retro-green/10 text-retro-green' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="Like this game"
                            >
                                <span>👍</span>
                                <span className="text-sm">{localGame.likes.length}</span>
                            </button>
                            <button
                                onClick={handleDislike}
                                className={`flex items-center space-x-1 px-2 py-1 rounded ${userDisliked ? 'bg-retro-pink/10 text-retro-pink' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="Dislike this game"
                            >
                                <span>👎</span>
                                <span className="text-sm">{localGame.dislikes.length}</span>
                            </button>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handlePlay}
                                className="bg-retro-blue hover:bg-retro-blue-dark text-white font-retro px-3 py-1 rounded text-sm flex items-center"
                                aria-label="Play game"
                            >
                                <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Play
                            </button>
                            <button
                                onClick={handleScoresClick}
                                className={`text-retro-blue hover:underline text-sm ${isShowingScores ? 'font-bold' : ''}`}
                            >
                                {isShowingScores ? 'Hide Scores' : 'Scores'}
                            </button>
                            <button
                                onClick={handleMessagesClick}
                                className={`text-retro-green hover:underline text-sm ${isShowingMessages ? 'font-bold' : ''}`}
                            >
                                {isShowingMessages ? 'Hide Chat' : 'Chat'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {(isShowingScores || isShowingMessages) && (
                <div className="mt-2 w-full">
                    {isShowingScores && (
                        <div className="bg-white rounded-lg shadow-md p-4 border-2 border-retro-blue">
                            <h4 className="text-retro-blue font-retro text-lg mb-2">
                                {localGame.name} Scores
                            </h4>
                            <HighScores game={localGame} />
                        </div>
                    )}
                    {isShowingMessages && (
                        <div className="bg-white rounded-lg shadow-md p-4 border-2 border-retro-green">
                            <h4 className="text-retro-green font-retro text-lg mb-2">
                                {localGame.name} Chat
                            </h4>
                            <Messages game={localGame} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default GameCard