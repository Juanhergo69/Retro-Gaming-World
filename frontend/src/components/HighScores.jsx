import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { fetchUserData } from '../logic/fetchUserData'
import { fetchGameHighscores } from '../logic/fetchGameHighscores'
import { truncateUsername } from '../utils/helpers'

function HighScores({ game }) {
    const { user } = useAuth()
    const [highscores, setHighscores] = useState(null)
    const [userCache, setUserCache] = useState({})

    const updateHighscoresWithLatestUserData = async (scores) => {
        const updatedScores = []

        for (const score of scores) {
            if (!userCache[score.userId]) {
                const userData = await fetchUserData(score.userId)
                if (userData) {
                    setUserCache(prev => ({
                        ...prev,
                        [score.userId]: userData
                    }))
                }
            }

            const currentUserData = userCache[score.userId] || {}
            updatedScores.push({
                ...score,
                username: currentUserData.username || score.username,
                avatar: currentUserData.avatar !== undefined ? currentUserData.avatar : score.avatar
            })
        }

        return updatedScores
    }

    useEffect(() => {
        const loadHighscores = async () => {
            const scores = await fetchGameHighscores(game.id)
            const updatedScores = await updateHighscoresWithLatestUserData(scores)
            setHighscores(updatedScores)
        }

        loadHighscores()
    }, [game.id, userCache])

    if (highscores === null) {
        return null
    }

    return (
        <div className="bg-white rounded-lg border-2 border-retro-blue overflow-hidden">
            <table className="w-full font-retro">
                <thead>
                    <tr className="bg-retro-blue text-white">
                        <th className="p-3 text-left">Rank</th>
                        <th className="p-3 text-left">Player</th>
                        <th className="p-3 text-right">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {highscores.length > 0 ? (
                        highscores.map((hs, index) => (
                            <tr
                                key={`${hs.userId}-${hs.score}-${index}`}
                                className={`border-b border-gray-200 ${user?.id === hs.userId
                                    ? 'bg-retro-blue/20'
                                    : ''
                                    }`}
                            >
                                <td className="p-3 font-bold text-gray-800">{index + 1}</td>
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        {hs.avatar ? (
                                            <img
                                                src={hs.avatar}
                                                alt={hs.username || 'Player'}
                                                className="w-8 h-8 rounded-full border-2 border-retro-yellow"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-retro-pink flex items-center justify-center border-2 border-retro-yellow">
                                                <span className="text-sm font-bold text-white">
                                                    {(hs.username || 'P').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-800">{truncateUsername(hs.username) || 'Player'}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-right font-mono text-lg text-retro-blue font-bold">{hs.score}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="p-4 text-center text-gray-500 font-retro">
                                No scores yet!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default HighScores