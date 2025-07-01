import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const GRID_SIZE = 25
const CELL_SIZE = 25
const INITIAL_SPEED = 150

const SnakeGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [snake, setSnake] = useState([{ x: 10, y: 10 }])
    const [food, setFood] = useState({ x: 5, y: 5 })
    const [direction, setDirection] = useState('RIGHT')
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [showInstructions, setShowInstructions] = useState(true)
    const gameLoopRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)

    useEffect(() => {
        const loadHighScore = async () => {
            if (user && gameId) {
                try {
                    const savedHighScore = await getHighScore(gameId, user.id)
                    setHighScore(savedHighScore)
                } catch (error) {
                    console.error("Error loading high score:", error)
                    setHighScore(0)
                }
            } else {
                setHighScore(0)
            }
        }

        loadHighScore()
    }, [user, gameId])

    const generateFood = useCallback(() => {
        const newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        }

        const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
        if (isOnSnake) return generateFood()

        return newFood
    }, [snake])

    const resetGame = useCallback(() => {
        setSnake([{ x: 10, y: 10 }])
        setDirection('RIGHT')
        setGameOver(false)
        setScore(0)
        speedRef.current = INITIAL_SPEED
        setFood(generateFood())
        setShowInstructions(false)
    }, [generateFood])

    const moveSnake = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setSnake(prevSnake => {
            const head = { ...prevSnake[0] }

            switch (direction) {
                case 'UP':
                    head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE
                    break
                case 'DOWN':
                    head.y = (head.y + 1) % GRID_SIZE
                    break
                case 'LEFT':
                    head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE
                    break
                case 'RIGHT':
                    head.x = (head.x + 1) % GRID_SIZE
                    break
            }

            const hitSelf = prevSnake.some((segment, index) =>
                index > 0 && segment.x === head.x && segment.y === head.y
            )

            if (hitSelf) {
                setGameOver(true)
                return prevSnake
            }

            const newSnake = [head, ...prevSnake]

            if (head.x === food.x && head.y === food.y) {
                setFood(generateFood())
                setScore(prev => {
                    const newScore = prev + 10
                    if (newScore > highScore) {
                        setHighScore(newScore)
                    }
                    return newScore
                })

                if (score > 0 && score % 50 === 0) {
                    speedRef.current = Math.max(speedRef.current - 10, 50)
                }
            } else {
                newSnake.pop()
            }

            return newSnake
        })
    }, [direction, food, gameOver, generateFood, isPaused, score, highScore, showInstructions])


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver) return

            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    if (direction !== 'DOWN') setDirection('UP')
                    break
                case 'arrowdown':
                case 's':
                    if (direction !== 'UP') setDirection('DOWN')
                    break
                case 'arrowleft':
                case 'a':
                    if (direction !== 'RIGHT') setDirection('LEFT')
                    break
                case 'arrowright':
                case 'd':
                    if (direction !== 'LEFT') setDirection('RIGHT')
                    break
                case ' ':
                case 'p':
                    setIsPaused(prev => !prev)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [direction, gameOver])

    useEffect(() => {
        if (!gameOver && !showInstructions) {
            gameLoopRef.current = setInterval(moveSnake, speedRef.current)
            return () => clearInterval(gameLoopRef.current)
        }
    }, [moveSnake, gameOver, showInstructions])

    useEffect(() => {
        if (gameOver && user && gameId && highScore > 0) {
            submitScore(
                user.id.toString(),
                gameId,
                highScore,
                {
                    username: user.username,
                    avatar: user.avatar
                }
            ).catch(error => {
                console.error('Error saving score:', error)
            })
        }
    }, [gameOver, highScore, gameId, user])

    const startGame = () => {
        setShowInstructions(false)
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col">
            <div className="bg-retro-purple p-4 flex justify-between items-center">
                <div className="font-retro text-white text-xl">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High Score: <span className="text-retro-green">{highScore}</span>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className="bg-retro-blue hover:bg-retro-blue-dark text-white font-retro px-4 py-2 rounded"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={() => navigate('/home')}
                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-4 py-2 rounded"
                    >
                        Exit
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div
                    className="relative bg-black border-4 border-retro-green"
                    style={{
                        width: `${GRID_SIZE * CELL_SIZE}px`,
                        height: `${GRID_SIZE * CELL_SIZE}px`
                    }}
                >
                    <div
                        className="absolute bg-retro-red rounded-full"
                        style={{
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                            left: `${food.x * CELL_SIZE}px`,
                            top: `${food.y * CELL_SIZE}px`
                        }}
                    />

                    {snake.map((segment, index) => (
                        <div
                            key={index}
                            className={`absolute ${index === 0 ? 'bg-retro-green' : 'bg-retro-blue'}`}
                            style={{
                                width: `${CELL_SIZE}px`,
                                height: `${CELL_SIZE}px`,
                                left: `${segment.x * CELL_SIZE}px`,
                                top: `${segment.y * CELL_SIZE}px`
                            }}
                        />
                    ))}

                    {gameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                            <h2 className="text-retro-pink font-retro text-4xl mb-6">GAME OVER</h2>
                            <p className="text-white text-xl mb-4">Your score: {score}</p>
                            <button
                                onClick={resetGame}
                                className="bg-retro-yellow hover:bg-retro-yellow-dark text-retro-dark font-retro px-6 py-3 rounded-lg text-xl"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {isPaused && !gameOver && !showInstructions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <h2 className="text-retro-blue font-retro text-4xl">PAUSED</h2>
                        </div>
                    )}

                    {showInstructions && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                            <div className="bg-retro-dark border-4 border-retro-yellow rounded-lg p-6 max-w-2xl w-full mx-4">
                                <h2 className="text-retro-green font-retro text-4xl mb-6 text-center">HOW TO PLAY SNAKE</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-2xl mb-3">Objective</h3>
                                        <p className="text-white mb-4">
                                            Control the snake to eat the food. Every time you eat, you grow and earn points.
                                            The more points you have, the faster you'll go. Avoid touching your own tail!
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-2xl mb-3">Scoring</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Food eaten: 10 points × level</li>
                                            <li>• Bonus food: 50 points × level</li>
                                            <li>• Speed increases with score</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-2xl mb-3">Controls</h3>
                                        <ul className="text-white space-y-3">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move left/right</li>
                                            <li>• <span className="text-retro-blue">↑ ↓</span> or <span className="text-retro-blue">W/S</span>: Move up/down</li>
                                            <li>• <span className="text-retro-blue">Space</span> or <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-2xl mt-6 mb-3">Game Over</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Colliding with your own tail</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={startGame}
                                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-8 py-3 rounded-lg text-xl"
                                    >
                                        START GAME
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="md:hidden bg-retro-dark p-4 grid grid-cols-3 gap-2">
                <div></div>
                <button
                    onClick={() => direction !== 'DOWN' && setDirection('UP')}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    ↑
                </button>
                <div></div>

                <button
                    onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    ←
                </button>
                <button
                    onClick={() => setIsPaused(prev => !prev)}
                    className="bg-retro-blue text-white p-4 rounded"
                >
                    {isPaused ? '▶' : '⏸'}
                </button>
                <button
                    onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    →
                </button>

                <div></div>
                <button
                    onClick={() => direction !== 'UP' && setDirection('DOWN')}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    ↓
                </button>
                <div></div>
            </div>
        </div>
    )
}

export default SnakeGame
