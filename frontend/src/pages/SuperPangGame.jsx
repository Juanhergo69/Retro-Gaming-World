import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const GRID_WIDTH = 21
const GRID_HEIGHT = 21
const CELL_SIZE = 25
const INITIAL_SPEED = 100
const INITIAL_BUBBLE_SPEED = {
    x: 0.05,
    y: 0.05
}
const PLAYER_SPEED = 8
const PLAYER_WIDTH = 40
const BULLET_SPEED = 10
const BUBBLE_SPAWN_RATE = 2000
const BUBBLE_SPAWN_ROW = 1

const DIRECTIONS = {
    LEFT: -1,
    RIGHT: 1
}

const BUBBLE_COLORS = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500'
]

const BUBBLE_SIZES = [1, 2, 3]

const SuperPangGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [player, setPlayer] = useState({
        x: GRID_WIDTH * CELL_SIZE / 2 - PLAYER_WIDTH / 2,
        direction: 'RIGHT',
        moving: false
    })
    const [bubbles, setBubbles] = useState([])
    const [bullets, setBullets] = useState([])
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [showInstructions, setShowInstructions] = useState(true)
    const bubbleSpawnRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)

    const initializeBoard = useCallback(() => {
        setBubbles([])
        setBullets([])
        setPlayer({
            x: GRID_WIDTH * CELL_SIZE / 2 - PLAYER_WIDTH / 2,
            direction: 'RIGHT',
            moving: false
        })
    }, [])

    const generateBubbles = useCallback(() => {
        const newBubbles = []
        for (let i = 0; i < 3 + level; i++) {
            newBubbles.push({
                x: Math.floor(Math.random() * GRID_WIDTH),
                y: BUBBLE_SPAWN_ROW + Math.floor(Math.random() * 3),
                size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)],
                color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
                dx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random()),
                dy: 0.5 + Math.random() * 0.5,
                id: Date.now() + i
            })
        }
        return newBubbles
    }, [level])

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

    const handleGameOver = useCallback(() => {
        setGameOver(true)
        clearInterval(bubbleSpawnRef.current)
    }, [])

    const advanceLevel = useCallback(() => {
        initializeBoard()
        setLevel(prevLevel => prevLevel + 1)
        speedRef.current = Math.max(INITIAL_SPEED - (level * 20), 30)
        setBubbles(generateBubbles())
    }, [initializeBoard, generateBubbles, level])

    const resetGame = useCallback(() => {
        initializeBoard()
        setScore(0)
        setLevel(1)
        setGameOver(false)
        setShowInstructions(false)
        speedRef.current = INITIAL_SPEED
        setBubbles(generateBubbles())
    }, [initializeBoard, generateBubbles])

    const movePlayer = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setPlayer(prev => {
            if (!prev.moving) return prev

            let newX = prev.x + (DIRECTIONS[prev.direction] * PLAYER_SPEED)

            if (newX < 0) {
                newX = 0
            } else if (newX > GRID_WIDTH * CELL_SIZE - PLAYER_WIDTH) {
                newX = GRID_WIDTH * CELL_SIZE - PLAYER_WIDTH
            }

            return {
                ...prev,
                x: newX
            }
        })
    }, [gameOver, isPaused, showInstructions])

    const moveBullets = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBullets(prevBullets => {
            return prevBullets
                .map(bullet => ({
                    ...bullet,
                    y: bullet.y - BULLET_SPEED
                }))
                .filter(bullet => bullet.y > 0)
        })
    }, [gameOver, isPaused, showInstructions])

    const moveBubbles = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBubbles(prevBubbles => {
            return prevBubbles.map(bubble => {
                const sizeSpeedFactor = 1 + (3 - bubble.size) * 0.2

                let newX = bubble.x + (bubble.dx * INITIAL_BUBBLE_SPEED.x * sizeSpeedFactor * (1 + level * 0.1))
                let newY = bubble.y + (bubble.dy * INITIAL_BUBBLE_SPEED.y * sizeSpeedFactor * (1 + level * 0.1))
                let newDx = bubble.dx
                let newDy = bubble.dy

                if (newX <= 0 || newX >= GRID_WIDTH - 1) {
                    newDx = -newDx * (0.9 + Math.random() * 0.2)
                    newX = Math.max(0, Math.min(GRID_WIDTH - 1, newX))
                }

                if (newY <= 0 || newY >= GRID_HEIGHT - 1) {
                    newDy = -newDy * (0.9 + Math.random() * 0.2)
                    newY = Math.max(0, Math.min(GRID_HEIGHT - 1, newY))
                }

                return {
                    ...bubble,
                    x: newX,
                    y: newY,
                    dx: newDx,
                    dy: newDy
                }
            })
        })
    }, [gameOver, isPaused, showInstructions, level])

    const spawnNewBubble = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBubbles(prev => {
            if (prev.length >= 10 + level * 2) return prev

            return [
                ...prev,
                {
                    x: Math.floor(Math.random() * GRID_WIDTH),
                    y: BUBBLE_SPAWN_ROW,
                    size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)],
                    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
                    dx: Math.random() > 0.5 ? 1 : -1,
                    dy: 0,
                    id: Date.now()
                }
            ]
        })
    }, [gameOver, isPaused, showInstructions, level])

    const checkCollisions = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBullets(prevBullets => {
            const remainingBullets = [...prevBullets]
            const newBubbles = [...bubbles]
            let scoreIncrease = 0

            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i]

                for (let j = bubbles.length - 1; j >= 0; j--) {
                    const bubble = bubbles[j]

                    const bubbleLeft = bubble.x * CELL_SIZE
                    const bubbleRight = (bubble.x + bubble.size) * CELL_SIZE
                    const bubbleTop = bubble.y * CELL_SIZE
                    const bubbleBottom = (bubble.y + bubble.size) * CELL_SIZE

                    const bulletLeft = bullet.x
                    const bulletRight = bullet.x + 5
                    const bulletTop = bullet.y
                    const bulletBottom = bullet.y + 10

                    if (
                        bulletRight > bubbleLeft &&
                        bulletLeft < bubbleRight &&
                        bulletBottom > bubbleTop &&
                        bulletTop < bubbleBottom
                    ) {
                        remainingBullets.splice(i, 1)

                        if (bubble.size > 1) {
                            newBubbles.splice(j, 1)
                            scoreIncrease += 50 * bubble.size

                            for (let k = 0; k < 2; k++) {
                                newBubbles.push({
                                    x: bubble.x + (k === 0 ? -0.5 : 0.5),
                                    y: bubble.y,
                                    size: bubble.size - 1,
                                    color: bubble.color,
                                    dx: (k === 0 ? -1 : 1) * (0.5 + Math.random()),
                                    dy: 0.5 + Math.random() * 0.5,
                                    id: Date.now() + k
                                })
                            }
                        } else {
                            newBubbles.splice(j, 1)
                            scoreIncrease += 100
                        }

                        break
                    }
                }
            }

            if (scoreIncrease > 0) {
                setScore(prev => {
                    const newScore = prev + scoreIncrease
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })

                setBubbles(newBubbles)
            }

            return remainingBullets
        })

        const playerHit = bubbles.some(bubble => {
            const bubbleSize = CELL_SIZE * bubble.size * 0.8
            const bubbleLeft = bubble.x * CELL_SIZE + (CELL_SIZE - bubbleSize) / 2
            const bubbleRight = bubbleLeft + bubbleSize
            const bubbleTop = bubble.y * CELL_SIZE + (CELL_SIZE - bubbleSize) / 2
            const bubbleBottom = bubbleTop + bubbleSize

            const playerHeight = 20
            const playerLeft = player.x + 5
            const playerRight = player.x + PLAYER_WIDTH - 5
            const playerTop = GRID_HEIGHT * CELL_SIZE - 25
            const playerBottom = playerTop + playerHeight

            return (
                playerRight > bubbleLeft &&
                playerLeft < bubbleRight &&
                playerBottom > bubbleTop + 5 &&
                playerTop < bubbleBottom - 5
            )
        })

        if (playerHit) {
            handleGameOver()
        }

        if (bubbles.length === 0) {
            advanceLevel()
        }
    }, [gameOver, isPaused, showInstructions, bubbles, bullets, highScore, player, handleGameOver, advanceLevel])

    const shootBullet = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBullets(prev => [
            ...prev,
            {
                x: player.x + PLAYER_WIDTH / 2 - 2.5,
                y: GRID_HEIGHT * CELL_SIZE - 30,
                id: Date.now()
            }
        ])
    }, [gameOver, isPaused, showInstructions, player.x])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver || showInstructions) return

            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    setPlayer(prev => ({
                        ...prev,
                        direction: 'LEFT',
                        moving: true
                    }))
                    break
                case 'arrowright':
                case 'd':
                    setPlayer(prev => ({
                        ...prev,
                        direction: 'RIGHT',
                        moving: true
                    }))
                    break
                case ' ':
                    shootBullet()
                    break
                case 'p':
                    setIsPaused(prev => !prev)
                    break
            }
        }

        const handleKeyUp = (e) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                case 'arrowright':
                case 'd':
                    setPlayer(prev => ({ ...prev, moving: false }))
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameOver, showInstructions, shootBullet])

    useEffect(() => {
        if (gameOver || showInstructions) return

        let lastTime = 0
        let animationFrameId

        const gameLoop = (timestamp) => {
            if (timestamp - lastTime > speedRef.current) {
                movePlayer()
                moveBullets()
                moveBubbles()
                checkCollisions()
                lastTime = timestamp
            }
            animationFrameId = requestAnimationFrame(gameLoop)
        }

        animationFrameId = requestAnimationFrame(gameLoop)

        bubbleSpawnRef.current = setInterval(spawnNewBubble, BUBBLE_SPAWN_RATE)

        return () => {
            cancelAnimationFrame(animationFrameId)
            clearInterval(bubbleSpawnRef.current)
        }
    }, [movePlayer, moveBullets, moveBubbles, checkCollisions, spawnNewBubble, gameOver, showInstructions])

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
        resetGame()
        setShowInstructions(false)
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col">
            <div className="bg-retro-purple p-4 flex justify-between items-center">
                <div className="font-retro text-white text-xl">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High Score: <span className="text-retro-green">{highScore}</span> |
                    Level: <span className="text-retro-blue">{level}</span>
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
                        width: `${GRID_WIDTH * CELL_SIZE}px`,
                        height: `${GRID_HEIGHT * CELL_SIZE}px`
                    }}
                >
                    {/* Player */}
                    <div
                        className="absolute bg-retro-yellow"
                        style={{
                            width: `${PLAYER_WIDTH - 10}px`,
                            height: '20px',
                            left: `${player.x + 5}px`,
                            top: `${GRID_HEIGHT * CELL_SIZE - 25}px`,
                            clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                        }}
                    />

                    {/* Bullets */}
                    {bullets.map((bullet) => (
                        <div
                            key={`bullet-${bullet.id}`}
                            className="absolute bg-retro-yellow"
                            style={{
                                width: '5px',
                                height: '10px',
                                left: `${bullet.x}px`,
                                top: `${bullet.y}px`
                            }}
                        />
                    ))}

                    {/* Bubbles */}
                    {bubbles.map((bubble) => (
                        <div
                            key={`bubble-${bubble.id}`}
                            className={`absolute rounded-full ${bubble.color}`}
                            style={{
                                width: `${CELL_SIZE * bubble.size * 0.8}px`,
                                height: `${CELL_SIZE * bubble.size * 0.8}px`,
                                left: `${bubble.x * CELL_SIZE + (CELL_SIZE - CELL_SIZE * bubble.size * 0.8) / 2}px`,
                                top: `${bubble.y * CELL_SIZE + (CELL_SIZE - CELL_SIZE * bubble.size * 0.8) / 2}px`
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
                                <h2 className="text-retro-green font-retro text-4xl mb-6 text-center">HOW TO PLAY SUPERPANG</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-2xl mb-3">Objective</h3>
                                        <p className="text-white mb-4">
                                            Shoot bubbles to break them into smaller pieces. Clear all bubbles before they reach the bottom.
                                            Smaller bubbles are worth more points.
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-2xl mb-3">Scoring</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Large bubble: 50 points</li>
                                            <li>• Medium bubble: 100 points</li>
                                            <li>• Small bubble: 150 points</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-2xl mb-3">Controls</h3>
                                        <ul className="text-white space-y-3">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move left/right</li>
                                            <li>• <span className="text-retro-blue">Space</span>: Shoot</li>
                                            <li>• <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-2xl mt-6 mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Game ends if any bubble reaches the bottom</li>
                                            <li>• Complete a level by clearing all bubbles</li>
                                            <li>• Score carries over between levels</li>
                                            <li>• Bubbles get faster with each level</li>
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
                    onClick={() => shootBullet()}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    Shoot
                </button>
                <div></div>

                <button
                    onTouchStart={() => setPlayer(prev => ({ ...prev, direction: 'LEFT', moving: true }))}
                    onTouchEnd={() => setPlayer(prev => ({ ...prev, moving: false }))}
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
                    onTouchStart={() => setPlayer(prev => ({ ...prev, direction: 'RIGHT', moving: true }))}
                    onTouchEnd={() => setPlayer(prev => ({ ...prev, moving: false }))}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    →
                </button>
            </div>
        </div>
    )
}

export default SuperPangGame