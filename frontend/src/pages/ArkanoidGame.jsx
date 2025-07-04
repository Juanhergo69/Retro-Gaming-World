import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const GRID_WIDTH = 21
const GRID_HEIGHT = 24
const CELL_SIZE = 25
const INITIAL_SPEED = 30
const PADDLE_WIDTH = 5
const BALL_SPEED = 0.3

const DIRECTIONS = {
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
}

const BRICK_COLORS = [
    'bg-red-500',    //Red//
    'bg-orange-400', //Orange//
    'bg-yellow-400', //Yellow//
    'bg-green-500',  //Green//
    'bg-blue-500',   //Blue//
]

const BRICK_PATTERNS = [
    //Level 1 - Classic//
    (width) => {
        const rows = 5
        const bricks = []
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < width - 2; col++) {
                bricks.push({ x: col + 1, y: row + 2, width: 1, height: 1 })
            }
        }
        return bricks
    },
    //Level 2 - Zigzag//
    (width) => {
        const bricks = []
        const rows = 6
        for (let row = 0; row < rows; row++) {
            const start = row % 2 === 0 ? 1 : 2
            for (let col = start; col < width - 2; col += 2) {
                bricks.push({ x: col, y: row + 2, width: 1, height: 1 })
            }
        }
        return bricks
    },
    //Level 3 - Piramid//
    (width) => {
        const bricks = []
        const center = Math.floor(width / 2)
        const rows = 5
        for (let row = 0; row < rows; row++) {
            const cols = row + 1
            const start = center - Math.floor(cols / 2)
            for (let col = start; col < start + cols; col++) {
                if (col >= 1 && col < width - 1) {
                    bricks.push({ x: col, y: row + 2, width: 1, height: 1 })
                }
            }
        }
        return bricks
    },
    //Level 4 - Frame//
    (width) => {
        const bricks = []
        const rows = 6
        for (let row = 0; row < rows; row++) {
            for (let col = 1; col < width - 1; col++) {
                if (row === 0 || row === rows - 1 || col === 1 || col === width - 2) {
                    bricks.push({ x: col, y: row + 2, width: 1, height: 1 })
                }
            }
        }
        return bricks
    },
    //Nivel 5+ - Random//
    (width) => {
        const bricks = []
        const rows = 3 + Math.floor(Math.random() * 4)
        const density = 0.4 + Math.random() * 0.3

        for (let row = 0; row < rows; row++) {
            for (let col = 1; col < width - 1; col++) {
                if (Math.random() < density) {
                    const brickWidth = Math.random() < 0.3 ? 2 : 1
                    if (col + brickWidth <= width - 1) {
                        bricks.push({ x: col, y: row + 2, width: brickWidth, height: 1 })
                        if (brickWidth > 1) col++
                    }
                }
            }
        }
        return bricks
    }
]

const ArkanoidGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [paddle, setPaddle] = useState({
        x: Math.floor(GRID_WIDTH / 2 - PADDLE_WIDTH / 2),
        y: GRID_HEIGHT - 2,
        direction: 'NONE',
    })
    const [ball, setBall] = useState({
        x: GRID_WIDTH / 2,
        y: GRID_HEIGHT - 3,
        dx: BALL_SPEED,
        dy: -BALL_SPEED
    })
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [showInstructions, setShowInstructions] = useState(true)
    const gameLoopRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)

    const initializeBricks = useCallback((currentLevel) => {
        const patternIndex = Math.min(currentLevel - 1, BRICK_PATTERNS.length - 1)
        const brickPositions = BRICK_PATTERNS[patternIndex](GRID_WIDTH)

        return brickPositions.map((pos) => {
            const row = pos.y - 2
            return {
                ...pos,
                color: BRICK_COLORS[row % BRICK_COLORS.length],
                points: (5 - (row % 5)) * 10,
                hitbox: {
                    left: pos.x,
                    right: pos.x + pos.width,
                    top: pos.y,
                    bottom: pos.y + pos.height
                }
            }
        })
    }, [])

    const [bricks, setBricks] = useState(() => initializeBricks(1))

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
    }, [])

    const advanceLevel = useCallback(() => {
        const newLevel = level + 1

        setBall({
            x: GRID_WIDTH / 2,
            y: GRID_HEIGHT - 3,
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            dy: -BALL_SPEED
        })
        setPaddle({
            x: Math.floor(GRID_WIDTH / 2 - PADDLE_WIDTH / 2),
            y: GRID_HEIGHT - 2,
            direction: 'NONE',
        })
        setBricks(initializeBricks(newLevel))
        setLevel(newLevel)

        speedRef.current = Math.max(INITIAL_SPEED - (newLevel * 3), 15)
    }, [level, initializeBricks])

    const resetGame = useCallback(() => {
        setBall({
            x: GRID_WIDTH / 2,
            y: GRID_HEIGHT - 3,
            dx: BALL_SPEED,
            dy: -BALL_SPEED
        })
        setPaddle({
            x: Math.floor(GRID_WIDTH / 2 - PADDLE_WIDTH / 2),
            y: GRID_HEIGHT - 2,
            direction: 'NONE',
        })
        setBricks(initializeBricks(1))
        setScore(0)
        setLevel(1)
        setGameOver(false)
        setShowInstructions(false)
        speedRef.current = INITIAL_SPEED
    }, [initializeBricks])

    const movePaddle = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setPaddle(prev => {
            if (prev.direction === 'NONE') return prev

            const direction = DIRECTIONS[prev.direction]
            let newX = prev.x + direction.x

            newX = Math.max(0, Math.min(newX, GRID_WIDTH - PADDLE_WIDTH))

            return {
                ...prev,
                x: newX
            }
        })
    }, [gameOver, isPaused, showInstructions])

    const moveBall = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBall(prev => {
            let newX = prev.x + prev.dx
            let newY = prev.y + prev.dy
            let newDx = prev.dx
            let newDy = prev.dy

            const ballRadius = 0.4

            //Left wall collision//
            if (newX - ballRadius <= 0) {
                newDx = Math.abs(newDx)
                newX = ballRadius
            }

            //Right wall collision//
            if (newX + ballRadius >= GRID_WIDTH) {
                newDx = -Math.abs(newDx)
                newX = GRID_WIDTH - ballRadius
            }

            //Top wall collision//
            if (newY - ballRadius <= 0) {
                newDy = Math.abs(newDy)
                newY = ballRadius
            }

            //Floor collision (game over)//
            if (newY + ballRadius >= GRID_HEIGHT) {
                handleGameOver()
                return prev
            }

            //Paddle collision//
            const paddleLeft = paddle.x
            const paddleRight = paddle.x + PADDLE_WIDTH
            const paddleTop = paddle.y
            const paddleBottom = paddle.y + 0.5

            if (
                newY + ballRadius >= paddleTop &&
                newY - ballRadius <= paddleBottom &&
                newX + ballRadius >= paddleLeft &&
                newX - ballRadius <= paddleRight
            ) {
                const hitPosition = (newX - paddleLeft) / PADDLE_WIDTH

                const angleFactor = (hitPosition - 0.5) * 2

                const speed = Math.sqrt(prev.dx ** 2 + prev.dy ** 2)
                newDx = angleFactor * speed * 0.8
                newDy = -Math.sqrt(speed ** 2 - newDx ** 2)

                newY = paddleTop - ballRadius
            }

            return {
                x: newX,
                y: newY,
                dx: newDx,
                dy: newDy
            }
        })
    }, [gameOver, isPaused, showInstructions, paddle, handleGameOver])

    const checkBrickCollisions = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setBall(prevBall => {
            const newBricks = [...bricks]
            let brickHit = false
            let pointsEarned = 0
            let newDx = prevBall.dx
            let newDy = prevBall.dy
            const ballRadius = 0.4

            const ballLeft = prevBall.x - ballRadius
            const ballRight = prevBall.x + ballRadius
            const ballTop = prevBall.y - ballRadius
            const ballBottom = prevBall.y + ballRadius

            for (let i = 0; i < newBricks.length; i++) {
                const brick = newBricks[i]
                if (
                    ballRight > brick.hitbox.left &&
                    ballLeft < brick.hitbox.right &&
                    ballBottom > brick.hitbox.top &&
                    ballTop < brick.hitbox.bottom
                ) {
                    brickHit = true
                    pointsEarned = brick.points

                    const overlapLeft = ballRight - brick.hitbox.left
                    const overlapRight = brick.hitbox.right - ballLeft
                    const overlapTop = ballBottom - brick.hitbox.top
                    const overlapBottom = brick.hitbox.bottom - ballTop

                    const minOverlap = Math.min(
                        overlapLeft, overlapRight,
                        overlapTop, overlapBottom
                    )

                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        newDx = -prevBall.dx
                    } else {
                        newDy = -prevBall.dy
                    }

                    newBricks.splice(i, 1)
                    break
                }
            }

            if (brickHit) {
                setBricks(newBricks)

                setScore(prevScore => {
                    const newScore = prevScore + pointsEarned
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })

                return {
                    ...prevBall,
                    dx: newDx,
                    dy: newDy
                }
            }

            if (newBricks.length === 0) {
                setTimeout(advanceLevel, 1000)
            }

            return prevBall
        })
    }, [gameOver, isPaused, showInstructions, bricks, highScore, advanceLevel])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver || showInstructions) return

            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    setPaddle(prev => ({ ...prev, direction: 'LEFT' }))
                    break
                case 'arrowright':
                case 'd':
                    setPaddle(prev => ({ ...prev, direction: 'RIGHT' }))
                    break
                case ' ':
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
                    setPaddle(prev => ({ ...prev, direction: 'NONE' }))
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [gameOver, showInstructions])

    useEffect(() => {
        if (!gameOver && !showInstructions) {
            gameLoopRef.current = setInterval(() => {
                movePaddle()
                moveBall()
                checkBrickCollisions()
            }, speedRef.current)
            return () => clearInterval(gameLoopRef.current)
        }
    }, [movePaddle, moveBall, checkBrickCollisions, gameOver, showInstructions])

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
                        width: `${GRID_WIDTH * CELL_SIZE + 10}px`,
                        height: `${GRID_HEIGHT * CELL_SIZE + 8}px`
                    }}
                >
                    {/* Bricks */}
                    {bricks.map((brick, index) => (
                        <div
                            key={`brick-${index}`}
                            className={`absolute ${brick.color} border border-gray-800`}
                            style={{
                                width: `${brick.width * CELL_SIZE}px`,
                                height: `${brick.height * CELL_SIZE}px`,
                                left: `${brick.x * CELL_SIZE}px`,
                                top: `${brick.y * CELL_SIZE}px`
                            }}
                        />
                    ))}

                    {/* Paddle */}
                    <div
                        className="absolute bg-white rounded"
                        style={{
                            width: `${PADDLE_WIDTH * CELL_SIZE}px`,
                            height: `${CELL_SIZE * 0.5}px`,
                            left: `${paddle.x * CELL_SIZE}px`,
                            top: `${paddle.y * CELL_SIZE}px`
                        }}
                    />

                    {/* Ball */}
                    <div
                        className="absolute bg-white rounded-full"
                        style={{
                            width: `${CELL_SIZE * 0.8}px`,
                            height: `${CELL_SIZE * 0.8}px`,
                            left: `${ball.x * CELL_SIZE - CELL_SIZE * 0.4}px`,
                            top: `${ball.y * CELL_SIZE - CELL_SIZE * 0.4}px`
                        }}
                    />

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
                                <h2 className="text-retro-green font-retro text-4xl mb-6 text-center">HOW TO PLAY ARKANOID</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-2xl mb-3">Objective</h3>
                                        <p className="text-white mb-4">
                                            Use the paddle to bounce the ball and break all the bricks.
                                            Don't let the ball fall below the paddle!
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-2xl mb-3">Scoring</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Bottom row (red): 50 points</li>
                                            <li>• Second row (orange): 40 points</li>
                                            <li>• Third row (yellow): 30 points</li>
                                            <li>• Fourth row (green): 20 points</li>
                                            <li>• Top row (blue): 10 points</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-2xl mb-3">Controls</h3>
                                        <ul className="text-white space-y-3">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move paddle left/right</li>
                                            <li>• <span className="text-retro-blue">Space</span> or <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-2xl mt-6 mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Game ends when the ball falls below the paddle</li>
                                            <li>• Complete a level by breaking all bricks</li>
                                            <li>• Score carries over between levels</li>
                                            <li>• The ball speeds up slightly with each level</li>
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
                <div></div>
                <div></div>

                <button
                    onClick={() => setPaddle(prev => ({ ...prev, direction: 'LEFT' }))}
                    onTouchEnd={() => setPaddle(prev => ({ ...prev, direction: 'NONE' }))}
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
                    onClick={() => setPaddle(prev => ({ ...prev, direction: 'RIGHT' }))}
                    onTouchEnd={() => setPaddle(prev => ({ ...prev, direction: 'NONE' }))}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    →
                </button>

                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
}

export default ArkanoidGame