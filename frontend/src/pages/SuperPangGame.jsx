import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const getCellSize = () => {
    const isMobile = window.innerWidth <= 768
    return isMobile ? Math.floor(window.innerWidth * 0.9 / 21) : 25
}

const TouchControlButton = ({
    children,
    onPress,
    onRelease,
    ariaLabel,
    className,
    disabled = false
}) => {
    const buttonRef = useRef(null)

    useEffect(() => {
        const button = buttonRef.current
        if (!button) return

        const handlePress = (e) => {
            e.preventDefault()
            if (!disabled) onPress()
        }

        const handleRelease = (e) => {
            e.preventDefault()
            if (!disabled && onRelease) onRelease()
        }

        button.addEventListener('touchstart', handlePress, { passive: false })
        button.addEventListener('touchend', handleRelease, { passive: false })
        button.addEventListener('mousedown', handlePress)
        button.addEventListener('mouseup', handleRelease)
        button.addEventListener('mouseleave', handleRelease)
        button.addEventListener('contextmenu', (e) => e.preventDefault())

        return () => {
            button.removeEventListener('touchstart', handlePress)
            button.removeEventListener('touchend', handleRelease)
            button.removeEventListener('mousedown', handlePress)
            button.removeEventListener('mouseup', handleRelease)
            button.removeEventListener('mouseleave', handleRelease)
            button.removeEventListener('contextmenu', (e) => e.preventDefault())
        }
    }, [onPress, onRelease, disabled])

    return (
        <button
            ref={buttonRef}
            className={`${className} touch-none select-none ${disabled ? 'opacity-50' : ''}`}
            aria-label={ariaLabel}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

const GRID_WIDTH = 21
const GRID_HEIGHT = 21
const INITIAL_SPEED = 100
const INITIAL_BUBBLE_SPEED = {
    x: 0.05,
    y: 0.05
}
const PLAYER_SPEED = 8
const PLAYER_WIDTH_RATIO = 1.6
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
    const [cellSize, setCellSize] = useState(getCellSize())
    const [playerWidth, setPlayerWidth] = useState(getCellSize() * PLAYER_WIDTH_RATIO)
    const [player, setPlayer] = useState({
        x: GRID_WIDTH * getCellSize() / 2 - (getCellSize() * PLAYER_WIDTH_RATIO) / 2,
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
    const [isShooting, setIsShooting] = useState(false)
    const bubbleSpawnRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)
    const gameContainerRef = useRef(null)

    useEffect(() => {
        const handleResize = () => {
            const newCellSize = getCellSize()
            setCellSize(newCellSize)
            setPlayerWidth(newCellSize * PLAYER_WIDTH_RATIO)

            setPlayer(prev => ({
                ...prev,
                x: Math.min(
                    Math.max(0, prev.x),
                    GRID_WIDTH * newCellSize - (newCellSize * PLAYER_WIDTH_RATIO)
                )
            }))
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const initializeBoard = useCallback(() => {
        setBubbles([])
        setBullets([])
        setPlayer({
            x: GRID_WIDTH * cellSize / 2 - playerWidth / 2,
            direction: 'RIGHT',
            moving: false
        })
    }, [cellSize, playerWidth])

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
            } else if (newX > GRID_WIDTH * cellSize - playerWidth) {
                newX = GRID_WIDTH * cellSize - playerWidth
            }

            return {
                ...prev,
                x: newX
            }
        })
    }, [gameOver, isPaused, showInstructions, cellSize, playerWidth])

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
                const bubbleRenderSize = bubble.size * 0.8
                const halfBubble = bubbleRenderSize / 2

                const leftBound = halfBubble + 0.01
                const rightBound = GRID_WIDTH - halfBubble - 0.01
                const topBound = halfBubble + 0.01
                const bottomBound = GRID_HEIGHT - halfBubble - 0.01

                let newX = bubble.x + (bubble.dx * INITIAL_BUBBLE_SPEED.x * sizeSpeedFactor * (1 + level * 0.1))
                let newY = bubble.y + (bubble.dy * INITIAL_BUBBLE_SPEED.y * sizeSpeedFactor * (1 + level * 0.1))
                let newDx = bubble.dx
                let newDy = bubble.dy

                if (newX <= leftBound) {
                    newDx = Math.abs(newDx) * (0.9 + Math.random() * 0.2)
                    newX = leftBound
                }

                else if (newX >= rightBound) {
                    newDx = -Math.abs(newDx) * (0.9 + Math.random() * 0.2)
                    newX = rightBound
                }

                if (newY <= topBound) {
                    newDy = Math.abs(newDy) * (0.9 + Math.random() * 0.2)
                    newY = topBound
                }

                else if (newY >= bottomBound) {
                    newDy = -Math.abs(newDy) * (0.9 + Math.random() * 0.2)
                    newY = bottomBound
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
                    const bubbleSize = cellSize * bubble.size * 0.8

                    const bubbleLeft = bubble.x * cellSize - (bubbleSize / 2)
                    const bubbleRight = bubbleLeft + bubbleSize
                    const bubbleTop = bubble.y * cellSize - (bubbleSize / 2)
                    const bubbleBottom = bubbleTop + bubbleSize

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
            const bubbleSize = cellSize * bubble.size * 0.8
            const bubbleLeft = bubble.x * cellSize - (bubbleSize / 2)
            const bubbleRight = bubbleLeft + bubbleSize
            const bubbleTop = bubble.y * cellSize - (bubbleSize / 2)
            const bubbleBottom = bubbleTop + bubbleSize

            const playerLeft = player.x + 5
            const playerRight = player.x + playerWidth - 5
            const playerTop = GRID_HEIGHT * cellSize - 25
            const playerBottom = playerTop + 20

            return (
                playerRight > bubbleLeft &&
                playerLeft < bubbleRight &&
                playerBottom > bubbleTop &&
                playerTop < bubbleBottom
            )
        })

        if (playerHit) {
            handleGameOver()
        }

        if (bubbles.length === 0) {
            advanceLevel()
        }
    }, [gameOver, isPaused, showInstructions, bubbles, bullets, highScore, player, cellSize, playerWidth, handleGameOver, advanceLevel])

    const shootBullet = useCallback(() => {
        if (gameOver || isPaused || showInstructions || isShooting) return;

        setIsShooting(true);
        setBullets(prev => [
            ...prev,
            {
                x: player.x + playerWidth / 2 - 2.5,
                y: GRID_HEIGHT * cellSize - 30,
                id: Date.now()
            }
        ])

        setTimeout(() => setIsShooting(false), 200)
    }, [gameOver, isPaused, showInstructions, player.x, playerWidth, cellSize, isShooting])

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

    const handleTouchStart = (direction) => {
        if (gameOver || isPaused || showInstructions) return
        setPlayer({
            direction,
            moving: true,
            x: player.x
        })
    }

    const handleTouchEnd = () => {
        setPlayer(prev => ({ ...prev, moving: false }))
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col">
            <div className="bg-retro-purple p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-center">
                <div className="font-retro text-white text-sm sm:text-xl mb-2 sm:mb-0 text-center sm:text-left">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High: <span className="text-retro-green">{highScore}</span> |
                    Level: <span className="text-retro-blue">{level}</span>
                </div>

                <div className="flex space-x-2 sm:space-x-3">
                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className="bg-retro-blue hover:bg-retro-blue-dark text-white font-retro px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={() => navigate('/home')}
                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
                    >
                        Exit
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-2 pt-4 md:pt-2">
                <div
                    ref={gameContainerRef}
                    className="relative bg-black border-4 border-retro-green"
                    style={{
                        width: `${GRID_WIDTH * cellSize}px`,
                        height: `${GRID_HEIGHT * cellSize}px`,
                        boxSizing: 'content-box',
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 200px)'
                    }}
                >
                    <div
                        className="absolute bg-retro-yellow"
                        style={{
                            width: `${playerWidth}px`,
                            height: '20px',
                            left: `${player.x}px`,
                            top: `${GRID_HEIGHT * cellSize - 25}px`,
                            clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'
                        }}
                    />

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

                    {bubbles.map((bubble) => (
                        <div
                            key={`bubble-${bubble.id}`}
                            className={`absolute rounded-full ${bubble.color}`}
                            style={{
                                width: `${cellSize * bubble.size * 0.8}px`,
                                height: `${cellSize * bubble.size * 0.8}px`,
                                left: `${Math.max(0, (bubble.x - bubble.size * 0.4) * cellSize)}px`,
                                top: `${Math.max(0, (bubble.y - bubble.size * 0.4) * cellSize)}px`,
                                transform: 'translate(0, 0)'
                            }}
                        />
                    ))}

                    {gameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                            <h2 className="text-retro-pink font-retro text-3xl md:text-4xl mb-4 md:mb-6">GAME OVER</h2>
                            <p className="text-white text-lg md:text-xl mb-3 md:mb-4">Your score: {score}</p>
                            <button
                                onClick={resetGame}
                                className="bg-retro-yellow hover:bg-retro-yellow-dark text-retro-dark font-retro px-4 py-2 md:px-6 md:py-3 rounded-lg text-lg md:text-xl"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {isPaused && !gameOver && !showInstructions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <h2 className="text-retro-blue font-retro text-3xl md:text-4xl">PAUSED</h2>
                        </div>
                    )}

                    {showInstructions && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                            <div className="bg-retro-dark border-4 border-retro-yellow rounded-lg p-4 md:p-6 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
                                <h2 className="text-retro-green font-retro text-3xl md:text-4xl mb-4 md:mb-6 text-center">HOW TO PLAY SUPERPANG</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-xl md:text-2xl mb-2 md:mb-3">Objective</h3>
                                        <p className="text-white mb-3 md:mb-4 text-sm md:text-base">
                                            Shoot bubbles to break them into smaller pieces. Clear all bubbles before they reach the bottom.
                                            Smaller bubbles are worth more points.
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-xl md:text-2xl mb-2 md:mb-3">Scoring</h3>
                                        <ul className="text-white space-y-1 md:space-y-2 text-sm md:text-base">
                                            <li>• Large bubble: 50 points</li>
                                            <li>• Medium bubble: 100 points</li>
                                            <li>• Small bubble: 150 points</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-xl md:text-2xl mb-2 md:mb-3">Controls</h3>
                                        <ul className="text-white space-y-1 md:space-y-3 text-sm md:text-base">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move left/right</li>
                                            <li>• <span className="text-retro-blue">Space</span>: Shoot</li>
                                            <li>• <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-xl md:text-2xl mt-4 md:mt-6 mb-2 md:mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-1 md:space-y-2 text-sm md:text-base">
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

            <div className="md:hidden bg-retro-dark/90 p-3 fixed bottom-0 left-0 right-0 select-none">
                <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                        <TouchControlButton
                            onPress={() => handleTouchStart('LEFT')}
                            onRelease={handleTouchEnd}
                            ariaLabel="Move left"
                            className="bg-retro-purple text-white w-16 h-16 flex items-center justify-center rounded-lg text-3xl active:bg-retro-purple-dark"
                        >
                            ←
                        </TouchControlButton>
                        <TouchControlButton
                            onPress={() => handleTouchStart('RIGHT')}
                            onRelease={handleTouchEnd}
                            ariaLabel="Move right"
                            className="bg-retro-purple text-white w-16 h-16 flex items-center justify-center rounded-lg text-3xl active:bg-retro-purple-dark"
                        >
                            →
                        </TouchControlButton>
                    </div>

                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className="bg-retro-blue text-white w-14 h-14 flex items-center justify-center rounded-lg text-2xl mx-3 touch-none active:bg-retro-blue-dark"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>

                    <TouchControlButton
                        onPress={shootBullet}
                        ariaLabel="Shoot"
                        className="bg-retro-pink text-white w-24 h-14 flex items-center justify-center rounded-lg text-lg font-bold active:bg-retro-pink-dark"
                        disabled={isShooting}
                    >
                        SHOOT
                    </TouchControlButton>
                </div>
            </div>
        </div>
    )
}

export default SuperPangGame