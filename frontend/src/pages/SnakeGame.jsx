import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const getGameDimensions = () => {
    const isMobile = window.innerWidth < 768
    const maxGridSize = 25
    if (!isMobile) {
        return {
            gridSize: 25,
            cellSize: 25,
            boardSize: 625
        }
    }
    const minViewportSize = Math.min(window.innerWidth, window.innerHeight)
    const padding = 20
    const availableSize = minViewportSize - padding * 2
    const minCellSize = 18
    const calculatedGridSize = Math.min(
        maxGridSize,
        Math.floor(availableSize / minCellSize)
    )
    const gridSize = Math.max(15, calculatedGridSize)
    const cellSize = Math.floor(availableSize / gridSize)
    return {
        gridSize,
        cellSize,
        boardSize: gridSize * cellSize
    }
}

const INITIAL_SPEED = 150

const SnakeGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [dimensions, setDimensions] = useState(getGameDimensions())
    const { gridSize, cellSize, boardSize } = dimensions
    const initialPosition = Math.floor(gridSize / 2)
    const [snake, setSnake] = useState([{ x: initialPosition, y: initialPosition }])
    const [food, setFood] = useState(() => ({
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
    }))
    const [direction, setDirection] = useState('RIGHT')
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [showInstructions, setShowInstructions] = useState(true)
    const gameLoopRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)
    const boardRef = useRef(null)

    useEffect(() => {
        const handleResize = () => {
            const newDimensions = getGameDimensions()
            setDimensions(newDimensions)

            if (newDimensions.gridSize !== gridSize) {
                setSnake(prevSnake => {
                    return prevSnake.map(segment => ({
                        x: Math.min(segment.x, newDimensions.gridSize - 1),
                        y: Math.min(segment.y, newDimensions.gridSize - 1)
                    }))
                })

                setFood(prevFood => ({
                    x: Math.min(prevFood.x, newDimensions.gridSize - 1),
                    y: Math.min(prevFood.y, newDimensions.gridSize - 1)
                }))
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [gridSize])

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
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        }

        const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
        if (isOnSnake) return generateFood()

        return newFood
    }, [snake, gridSize])

    const resetGame = useCallback(() => {
        const center = Math.floor(gridSize / 2)
        setSnake([{ x: center, y: center }])
        setDirection('RIGHT')
        setGameOver(false)
        setScore(0)
        speedRef.current = INITIAL_SPEED
        setFood(generateFood())
        setShowInstructions(false)
    }, [generateFood, gridSize])

    const moveSnake = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setSnake(prevSnake => {
            const head = { ...prevSnake[0] }

            switch (direction) {
                case 'UP':
                    head.y = (head.y - 1 + gridSize) % gridSize
                    break
                case 'DOWN':
                    head.y = (head.y + 1) % gridSize
                    break
                case 'LEFT':
                    head.x = (head.x - 1 + gridSize) % gridSize
                    break
                case 'RIGHT':
                    head.x = (head.x + 1) % gridSize
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
    }, [direction, food, gameOver, generateFood, isPaused, score, highScore, showInstructions, gridSize])

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

    const headerStyle = "bg-retro-purple p-2 md:p-3 flex flex-col md:flex-row justify-between items-center"
    const gameBoardStyle = {
        width: `${boardSize}px`,
        height: `${boardSize}px`,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 180px)',
        minWidth: '250px',
        minHeight: '250px'
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col overflow-hidden">
            <div className={headerStyle}>
                <div className="font-retro text-white text-base md:text-lg mb-2 md:mb-0 text-center md:text-left">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High: <span className="text-retro-green">{highScore}</span>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className="bg-retro-blue hover:bg-retro-blue-dark text-white font-retro px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={() => navigate('/home')}
                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm"
                    >
                        Exit
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-auto">
                <div
                    ref={boardRef}
                    className="relative bg-black border-2 md:border-4 border-retro-green"
                    style={gameBoardStyle}
                >
                    <div
                        className="absolute bg-retro-red rounded-full"
                        style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            left: `${food.x * cellSize}px`,
                            top: `${food.y * cellSize}px`,
                            transform: 'translateZ(0)'
                        }}
                    />

                    {snake.map((segment, index) => (
                        <div
                            key={index}
                            className={`absolute ${index === 0 ? 'bg-retro-green' : 'bg-retro-blue'}`}
                            style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                left: `${segment.x * cellSize}px`,
                                top: `${segment.y * cellSize}px`,
                                transform: 'translateZ(0)'
                            }}
                        />
                    ))}

                    {gameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4">
                            <h2 className="text-retro-pink font-retro text-2xl md:text-3xl mb-3 md:mb-4 text-center">GAME OVER</h2>
                            <p className="text-white text-base md:text-lg mb-2 md:mb-3">Your score: {score}</p>
                            <button
                                onClick={resetGame}
                                className="bg-retro-yellow hover:bg-retro-yellow-dark text-retro-dark font-retro px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-base md:text-lg"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {isPaused && !gameOver && !showInstructions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <h2 className="text-retro-blue font-retro text-2xl md:text-3xl">PAUSED</h2>
                        </div>
                    )}

                    {showInstructions && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-auto">
                            <div className="bg-retro-dark border-2 md:border-4 border-retro-yellow rounded-lg p-4 md:p-5 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                                <h2 className="text-retro-green font-retro text-xl md:text-2xl mb-3 md:mb-4 text-center">HOW TO PLAY SNAKE</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-xl md:text-2xl mb-2 md:mb-3">Objective</h3>
                                        <p className="text-white mb-3 md:mb-4 text-sm md:text-base">
                                            Control the snake to eat the food. Every time you eat, you grow and earn points.
                                            The more points you have, the faster you'll go. Avoid touching your own tail!
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-xl md:text-2xl mb-2 md:mb-3">Scoring</h3>
                                        <ul className="text-white space-y-1 md:space-y-2 text-sm md:text-base">
                                            <li>• Food eaten: 10 points × level</li>
                                            <li>• Bonus food: 50 points × level</li>
                                            <li>• Speed increases with score</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-xl md:text-2xl mb-2 md:mb-3">Controls</h3>
                                        <ul className="text-white space-y-2 md:space-y-3 text-sm md:text-base">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move left/right</li>
                                            <li>• <span className="text-retro-blue">↑ ↓</span> or <span className="text-retro-blue">W/S</span>: Move up/down</li>
                                            <li>• <span className="text-retro-blue">Space</span> or <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                            <li>• <span className="text-retro-blue">Touch buttons</span> on mobile</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-xl md:text-2xl mt-4 md:mt-6 mb-2 md:mb-3">Game Over</h3>
                                        <ul className="text-white space-y-1 md:space-y-2 text-sm md:text-base">
                                            <li>• Colliding with your own tail</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={startGame}
                                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-6 py-2 md:px-8 md:py-3 rounded-lg text-lg md:text-xl"
                                    >
                                        START GAME
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="md:hidden bg-retro-dark p-3 grid grid-cols-3 gap-2 touch-none">
                <div></div>
                <button
                    onClick={() => direction !== 'DOWN' && setDirection('UP')}
                    className="bg-retro-purple text-white p-3 rounded-lg text-xl active:bg-retro-purple-dark touch-pan-y"
                    aria-label="Move up"
                >
                    ↑
                </button>
                <div></div>

                <button
                    onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
                    className="bg-retro-purple text-white p-3 rounded-lg text-xl active:bg-retro-purple-dark touch-pan-y"
                    aria-label="Move left"
                >
                    ←
                </button>
                <button
                    onClick={() => setIsPaused(prev => !prev)}
                    className="bg-retro-blue text-white p-3 rounded-lg text-xl active:bg-retro-blue-dark touch-pan-y"
                    aria-label="Pause game"
                >
                    {isPaused ? '▶' : '⏸'}
                </button>
                <button
                    onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
                    className="bg-retro-purple text-white p-3 rounded-lg text-xl active:bg-retro-purple-dark touch-pan-y"
                    aria-label="Move right"
                >
                    →
                </button>

                <div></div>
                <button
                    onClick={() => direction !== 'UP' && setDirection('DOWN')}
                    className="bg-retro-purple text-white p-3 rounded-lg text-xl active:bg-retro-purple-dark touch-pan-y"
                    aria-label="Move down"
                >
                    ↓
                </button>
                <div></div>
            </div>
        </div>
    )
}

export default SnakeGame
