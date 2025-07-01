import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const GRID_SIZE = 21
const CELL_SIZE = 25
const INITIAL_SPEED = 200
const POWER_PELLET_DURATION = 5000

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
}

const GHOST_COLORS = [
    'bg-red-500',   //Red (Blinky)//
    'bg-pink-400',  //Pink (Pinky)//
    'bg-cyan-400',  //Cian (Inky)//
    'bg-orange-400' //Orange (Clyde)//
]

const MAZE_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]

const PacmanGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [pacman, setPacman] = useState({
        x: 10,
        y: 15,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        justTeleported: false
    })
    const [ghosts, setGhosts] = useState([])
    const [dots, setDots] = useState([])
    const [powerPellets, setPowerPellets] = useState([])
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [showInstructions, setShowInstructions] = useState(true)
    const [powerPelletActive, setPowerPelletActive] = useState(false)
    const gameLoopRef = useRef()
    const powerPelletTimerRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)
    const wallsRef = useRef(new Set())

    const getTriangleStyle = (direction) => {
        const clipPath = {
            'RIGHT': 'polygon(50% 50%, 110% 20%, 110% 80%)',
            'LEFT': 'polygon(50% 50%, -10% 20%, -10% 80%)',
            'UP': 'polygon(50% 50%, 20% -10%, 80% -10%)',
            'DOWN': 'polygon(50% 50%, 20% 110%, 80% 110%)'
        }

        return {
            width: '100%',
            height: '100%',
            clipPath: clipPath[direction] || clipPath['RIGHT'],
            left: '0%',
            top: '0%',

        }
    }

    const isValidPacmanMove = useCallback((x, y) => {
        const gridX = Math.floor(x)
        const gridY = Math.floor(y)

        if (gridY === 10 && (x < 0 || x >= GRID_SIZE)) {
            return true
        }

        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
            return false
        }

        return MAZE_LAYOUT[gridY][gridX] === 0
    }, [])

    const isValidGhostMove = useCallback((x, y) => {
        const gridX = Math.floor(x)
        const gridY = Math.floor(y)

        if (gridY === 10 && (x < 0 || x >= GRID_SIZE)) {
            return true
        }

        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
            return false
        }

        return MAZE_LAYOUT[gridY][gridX] === 0
    }, [])

    const initializeBoard = useCallback(() => {
        const newDots = []
        const newPowerPellets = []
        const walls = new Set()

        for (let y = 0; y < MAZE_LAYOUT.length; y++) {
            for (let x = 0; x < MAZE_LAYOUT[y].length; x++) {
                if (MAZE_LAYOUT[y][x] === 1) {
                    walls.add(`${x},${y}`)
                } else if (MAZE_LAYOUT[y][x] === 0) {
                    if ((x === 1 && y === 1) ||
                        (x === 19 && y === 1) ||
                        (x === 1 && y === 19) ||
                        (x === 19 && y === 19)) {
                        newPowerPellets.push({ x, y })
                    } else {
                        newDots.push({ x, y })
                    }
                }
            }
        }

        wallsRef.current = walls
        return { dots: newDots, powerPellets: newPowerPellets }
    }, [])

    const generateGhosts = useCallback(() => {
        const ghostPositions = [
            { x: 9, y: 8 },   //Red (Blinky)//
            { x: 10, y: 8 },  //Pink (Pinky)//
            { x: 11, y: 8 },  //Cian (Inky)//
            { x: 10, y: 9 }   //Orange (Clyde)//
        ]

        return ghostPositions.map((pos, i) => {
            let initialX = pos.x
            let initialY = pos.y

            if (!isValidGhostMove(initialX, initialY)) {
                const offsets = [1, -1, 2, -2, 3, -3]
                for (const offsetX of offsets) {
                    for (const offsetY of offsets) {
                        const testX = initialX + offsetX
                        const testY = initialY + offsetY
                        if (isValidGhostMove(testX, testY)) {
                            initialX = testX
                            initialY = testY
                            break
                        }
                    }
                    if (isValidGhostMove(initialX, initialY)) break
                }
            }

            return {
                x: initialX,
                y: initialY,
                color: GHOST_COLORS[i],
                direction: ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)],
                isScared: false,
                id: i,
                moveCounter: 0,
                speed: 0.6 + (i * 0.03)
            }
        })
    }, [isValidGhostMove])

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

    const handlePacmanDeath = useCallback(() => {
        setGameOver(true)
        setPowerPelletActive(false)
        clearTimeout(powerPelletTimerRef.current)
    }, [])

    const advanceLevel = useCallback(() => {
        const { dots, powerPellets } = initializeBoard()
        setPacman({ x: 10, y: 15, direction: 'RIGHT', nextDirection: 'RIGHT' })
        setGhosts(generateGhosts())
        setDots(dots)
        setPowerPellets(powerPellets)
        setPowerPelletActive(false)
        clearTimeout(powerPelletTimerRef.current)
        setLevel(prevLevel => prevLevel + 1)
        speedRef.current = Math.max(INITIAL_SPEED - (level * 10), 50)
    }, [initializeBoard, generateGhosts, level])

    const resetGame = useCallback(() => {
        const { dots, powerPellets } = initializeBoard()
        setPacman({ x: 10, y: 15, direction: 'RIGHT', nextDirection: 'RIGHT' })
        setGhosts(generateGhosts())
        setDots(dots)
        setPowerPellets(powerPellets)
        setScore(0)
        setLevel(1)
        setPowerPelletActive(false)
        clearTimeout(powerPelletTimerRef.current)
        setGameOver(false)
        setShowInstructions(false)
    }, [initializeBoard, generateGhosts])

    const movePacman = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setPacman(prev => {
            const nextDir = prev.nextDirection
            let nextX = prev.x + DIRECTIONS[nextDir].x
            let nextY = prev.y + DIRECTIONS[nextDir].y

            const isValidNextMove = isValidPacmanMove(nextX, nextY)

            const newDirection = isValidNextMove ? nextDir : prev.direction

            let moveX = prev.x + DIRECTIONS[newDirection].x
            let moveY = prev.y + DIRECTIONS[newDirection].y

            if (Math.floor(moveY) === 10) {
                if (moveX < 0) {
                    return {
                        x: GRID_SIZE - 1,
                        y: moveY,
                        direction: newDirection,
                        nextDirection: prev.nextDirection
                    }
                }
                else if (moveX >= GRID_SIZE) {
                    return {
                        x: 0,
                        y: moveY,
                        direction: newDirection,
                        nextDirection: prev.nextDirection
                    }
                }
            }

            const isValidMove = isValidPacmanMove(moveX, moveY)

            if (!isValidMove) {
                return { ...prev, direction: newDirection }
            }

            return {
                x: moveX,
                y: moveY,
                direction: newDirection,
                nextDirection: prev.nextDirection
            }
        })
    }, [gameOver, isPaused, showInstructions, isValidPacmanMove])

    const checkDotsAndPellets = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        let currentX = pacman.x
        let currentY = pacman.y

        if (pacman.justTeleported) return

        setDots(prevDots => {
            const dotIndex = prevDots.findIndex(dot =>
                Math.floor(dot.x) === Math.floor(currentX) &&
                Math.floor(dot.y) === Math.floor(currentY))
            if (dotIndex !== -1) {
                const newDots = [...prevDots]
                newDots.splice(dotIndex, 1)
                setScore(prevScore => {
                    const newScore = prevScore + 10
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })
                return newDots
            }
            return prevDots
        })

        setPowerPellets(prevPellets => {
            const pelletIndex = prevPellets.findIndex(pellet =>
                Math.floor(pellet.x) === Math.floor(currentX) &&
                Math.floor(pellet.y) === Math.floor(currentY))
            if (pelletIndex !== -1) {
                const newPellets = [...prevPellets]
                newPellets.splice(pelletIndex, 1)
                setScore(prevScore => {
                    const newScore = prevScore + 50
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })

                setPowerPelletActive(true)
                setGhosts(prevGhosts => prevGhosts.map(ghost => ({
                    ...ghost,
                    isScared: true,
                    speed: 0.4
                })))

                clearTimeout(powerPelletTimerRef.current)
                powerPelletTimerRef.current = setTimeout(() => {
                    setPowerPelletActive(false)
                    setGhosts(prevGhosts => prevGhosts.map(ghost => ({
                        ...ghost,
                        isScared: false,
                        speed: 0.6 + (ghost.id * 0.03)
                    })))
                }, POWER_PELLET_DURATION)

                return newPellets
            }
            return prevPellets
        })
    }, [gameOver, isPaused, showInstructions, pacman.x, pacman.y, pacman.justTeleported, highScore])

    const moveGhosts = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        setGhosts(prevGhosts => {
            return prevGhosts.map(ghost => {
                if (Math.random() > ghost.speed) {
                    return ghost
                }

                let newDirection = ghost.direction
                let possibleDirections = ['UP', 'DOWN', 'LEFT', 'RIGHT']

                const oppositeDir = {
                    'UP': 'DOWN',
                    'DOWN': 'UP',
                    'LEFT': 'RIGHT',
                    'RIGHT': 'LEFT'
                }

                possibleDirections = possibleDirections.filter(dir => dir !== oppositeDir[ghost.direction])

                if (ghost.isScared) {
                    possibleDirections.sort((a, b) => {
                        const distA = Math.sqrt(
                            Math.pow(pacman.x - (ghost.x + DIRECTIONS[a].x), 2) +
                            Math.pow(pacman.y - (ghost.y + DIRECTIONS[a].y), 2)
                        )
                        const distB = Math.sqrt(
                            Math.pow(pacman.x - (ghost.x + DIRECTIONS[b].x), 2) +
                            Math.pow(pacman.y - (ghost.y + DIRECTIONS[b].y), 2)
                        )
                        return distB - distA
                    })

                    if (Math.random() < 0.2) {
                        possibleDirections.sort(() => Math.random() - 0.5)
                    }
                } else {
                    switch (ghost.id % 4) {
                        case 0: //Blinky (red) - pursue directly//
                            possibleDirections.sort((a, b) => {
                                const distA = Math.sqrt(
                                    Math.pow(pacman.x - (ghost.x + DIRECTIONS[a].x), 2) +
                                    Math.pow(pacman.y - (ghost.y + DIRECTIONS[a].y), 2)
                                )
                                const distB = Math.sqrt(
                                    Math.pow(pacman.x - (ghost.x + DIRECTIONS[b].x), 2) +
                                    Math.pow(pacman.y - (ghost.y + DIRECTIONS[b].y), 2)
                                )
                                return distA - distB
                            })
                            break
                        case 1: //Pinky (pink) - try to intercept//
                            possibleDirections.sort((a, b) => {
                                const targetX = pacman.x + (DIRECTIONS[pacman.direction].x * 4)
                                const targetY = pacman.y + (DIRECTIONS[pacman.direction].y * 4)
                                const distA = Math.sqrt(
                                    Math.pow(targetX - (ghost.x + DIRECTIONS[a].x), 2) +
                                    Math.pow(targetY - (ghost.y + DIRECTIONS[a].y), 2)
                                )
                                const distB = Math.sqrt(
                                    Math.pow(targetX - (ghost.x + DIRECTIONS[b].x), 2) +
                                    Math.pow(targetY - (ghost.y + DIRECTIONS[b].y), 2)
                                )
                                return distA - distB
                            })
                            break
                        case 2: //Inky (cian) - more unpredictable behavior//
                            if (Math.random() > 0.5) {
                                possibleDirections.sort(() => Math.random() - 0.5)
                            } else {
                                //Sometimes follows Blinky (red)//
                                const blinky = prevGhosts.find(g => g.id % 4 === 0)
                                if (blinky) {
                                    const targetX = 2 * pacman.x - blinky.x
                                    const targetY = 2 * pacman.y - blinky.y
                                    possibleDirections.sort((a, b) => {
                                        const distA = Math.sqrt(
                                            Math.pow(targetX - (ghost.x + DIRECTIONS[a].x), 2) +
                                            Math.pow(targetY - (ghost.y + DIRECTIONS[a].y), 2)
                                        )
                                        const distB = Math.sqrt(
                                            Math.pow(targetX - (ghost.x + DIRECTIONS[b].x), 2) +
                                            Math.pow(targetY - (ghost.y + DIRECTIONS[b].y), 2)
                                        )
                                        return distA - distB
                                    })
                                }
                            }
                            break
                        case 3: //Clyde (orange) - alternates between chasing and moving away//
                            const distanceToPacman = Math.sqrt(
                                Math.pow(pacman.x - ghost.x, 2) +
                                Math.pow(pacman.y - ghost.y, 2)
                            )
                            if (distanceToPacman < 8) {
                                possibleDirections.sort((a, b) => {
                                    const distA = Math.sqrt(
                                        Math.pow(pacman.x - (ghost.x + DIRECTIONS[a].x), 2) +
                                        Math.pow(pacman.y - (ghost.y + DIRECTIONS[a].y), 2)
                                    )
                                    const distB = Math.sqrt(
                                        Math.pow(pacman.x - (ghost.x + DIRECTIONS[b].x), 2) +
                                        Math.pow(pacman.y - (ghost.y + DIRECTIONS[b].y), 2)
                                    )
                                    return distB - distA
                                })
                            } else {
                                possibleDirections.sort((a, b) => {
                                    const distA = Math.sqrt(
                                        Math.pow(pacman.x - (ghost.x + DIRECTIONS[a].x), 2) +
                                        Math.pow(pacman.y - (ghost.y + DIRECTIONS[a].y), 2)
                                    )
                                    const distB = Math.sqrt(
                                        Math.pow(pacman.x - (ghost.x + DIRECTIONS[b].x), 2) +
                                        Math.pow(pacman.y - (ghost.y + DIRECTIONS[b].y), 2)
                                    )
                                    return distA - distB
                                })
                            }
                            break
                    }
                }

                const validDirections = possibleDirections.filter(dir => {
                    const testX = ghost.x + DIRECTIONS[dir].x
                    const testY = ghost.y + DIRECTIONS[dir].y
                    return isValidGhostMove(testX, testY)
                })

                if (validDirections.length > 0) {
                    newDirection = validDirections[0]
                } else {
                    newDirection = oppositeDir[ghost.direction]
                }

                let newX = ghost.x + DIRECTIONS[newDirection].x
                let newY = ghost.y + DIRECTIONS[newDirection].y

                if (Math.floor(newY) === 10) {
                    if (newX < 0) {
                        newX = GRID_SIZE - 1
                    } else if (newX >= GRID_SIZE) {
                        newX = 0
                    }
                }

                return {
                    ...ghost,
                    x: newX,
                    y: newY,
                    direction: newDirection,
                    moveCounter: 0
                }
            })
        })
    }, [gameOver, isPaused, showInstructions, pacman.x, pacman.y, pacman.direction, isValidGhostMove])

    const checkCollisions = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return

        const pacmanLeft = pacman.x * CELL_SIZE + CELL_SIZE * 0.1
        const pacmanRight = pacmanLeft + CELL_SIZE * 0.8
        const pacmanTop = pacman.y * CELL_SIZE + CELL_SIZE * 0.1
        const pacmanBottom = pacmanTop + CELL_SIZE * 0.8

        const collidingGhost = ghosts.find(ghost => {
            const ghostLeft = ghost.x * CELL_SIZE + CELL_SIZE * 0.1
            const ghostRight = ghostLeft + CELL_SIZE * 0.8
            const ghostTop = ghost.y * CELL_SIZE + CELL_SIZE * 0.1
            const ghostBottom = ghostTop + CELL_SIZE * 0.8

            return !(
                pacmanRight < ghostLeft ||
                pacmanLeft > ghostRight ||
                pacmanBottom < ghostTop ||
                pacmanTop > ghostBottom
            )
        })

        if (collidingGhost) {
            if (collidingGhost.isScared) {
                setScore(prevScore => {
                    const newScore = prevScore + 200
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })

                setGhosts(prevGhosts =>
                    prevGhosts.map(ghost => {
                        if (ghost.id === collidingGhost.id) {
                            return {
                                ...ghost,
                                x: 10 + (ghost.id % 2),
                                y: 8 + Math.floor(ghost.id / 2),
                                isScared: false,
                                direction: ['UP', 'DOWN', 'LEFT', 'RIGHT'][ghost.id % 4],
                                moveCounter: 10
                            }
                        }
                        return ghost
                    })
                )
            } else {
                setGameOver(true)
                return
            }
        }

        if (dots.length === 0 && powerPellets.length === 0) {
            advanceLevel()
        }
    }, [gameOver, isPaused, showInstructions, ghosts, pacman.x, pacman.y, highScore, dots.length, powerPellets.length, handlePacmanDeath, advanceLevel])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver || showInstructions) return

            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    setPacman(prev => ({ ...prev, nextDirection: 'UP' }))
                    break
                case 'arrowdown':
                case 's':
                    setPacman(prev => ({ ...prev, nextDirection: 'DOWN' }))
                    break
                case 'arrowleft':
                case 'a':
                    setPacman(prev => ({ ...prev, nextDirection: 'LEFT' }))
                    break
                case 'arrowright':
                case 'd':
                    setPacman(prev => ({ ...prev, nextDirection: 'RIGHT' }))
                    break
                case ' ':
                case 'p':
                    setIsPaused(prev => !prev)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [gameOver, showInstructions])

    useEffect(() => {
        if (!gameOver && !showInstructions) {
            gameLoopRef.current = setInterval(() => {
                movePacman()
                checkDotsAndPellets()
                moveGhosts()
                checkCollisions()
            }, speedRef.current)
            return () => clearInterval(gameLoopRef.current)
        }
    }, [movePacman, moveGhosts, checkCollisions, checkDotsAndPellets, gameOver, showInstructions])

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

    const renderWalls = () => {
        const walls = []
        for (let y = 0; y < MAZE_LAYOUT.length; y++) {
            for (let x = 0; x < MAZE_LAYOUT[y].length; x++) {
                if (MAZE_LAYOUT[y][x] === 1) {
                    walls.push(
                        <div
                            key={`wall-${x}-${y}`}
                            className="absolute bg-retro-blue"
                            style={{
                                width: `${CELL_SIZE}px`,
                                height: `${CELL_SIZE}px`,
                                left: `${x * CELL_SIZE}px`,
                                top: `${y * CELL_SIZE}px`
                            }}
                        />
                    )
                }
            }
        }
        return walls
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
                        width: `33.3rem`,
                        height: `34.8rem`
                    }}
                >
                    {renderWalls()}

                    {/* Dots */}
                    {dots.map((dot, index) => (
                        <div
                            key={`dot-${index}`}
                            className="absolute bg-white rounded-full"
                            style={{
                                width: `${CELL_SIZE / 4}px`,
                                height: `${CELL_SIZE / 4}px`,
                                left: `${dot.x * CELL_SIZE + CELL_SIZE / 2 - CELL_SIZE / 8}px`,
                                top: `${dot.y * CELL_SIZE + CELL_SIZE / 2 - CELL_SIZE / 8}px`
                            }}
                        />
                    ))}

                    {/* Power pellets */}
                    {powerPellets.map((pellet, index) => (
                        <div
                            key={`pellet-${index}`}
                            className="absolute bg-retro-yellow rounded-full"
                            style={{
                                width: `${CELL_SIZE / 2}px`,
                                height: `${CELL_SIZE / 2}px`,
                                left: `${pellet.x * CELL_SIZE + CELL_SIZE / 4}px`,
                                top: `${pellet.y * CELL_SIZE + CELL_SIZE / 4}px`
                            }}
                        />
                    ))}

                    {/* Pacman */}
                    <div
                        className="absolute bg-retro-yellow rounded-full overflow-hidden"
                        style={{
                            width: `${CELL_SIZE * 0.8}px`,
                            height: `${CELL_SIZE * 0.8}px`,
                            left: `${pacman.x * CELL_SIZE + CELL_SIZE * 0.1}px`,
                            top: `${pacman.y * CELL_SIZE + CELL_SIZE * 0.1}px`,
                            position: 'relative',
                            transformStyle: 'preserve-3d',
                            border: '1px solid retro-dark',
                        }}
                    >
                        {/* Pacman mouth */}
                        <div
                            className="absolute bg-retro-dark"
                            style={{
                                ...getTriangleStyle(pacman.direction),
                                backfaceVisibility: 'hidden',
                                transform: 'translateZ(0)',
                            }}
                        />
                    </div>

                    {/* Ghosts */}
                    {ghosts.map((ghost) => (
                        <div
                            key={`ghost-${ghost.id}`}
                            className={`absolute rounded-t-full ${ghost.isScared ?
                                (powerPelletActive ? 'bg-white animate-pulse' : 'bg-purple-800') :
                                ghost.color}`}
                            style={{
                                width: `${CELL_SIZE * 0.8}px`,
                                height: `${CELL_SIZE * 0.8}px`,
                                left: `${ghost.x * CELL_SIZE + CELL_SIZE * 0.1}px`,
                                top: `${ghost.y * CELL_SIZE + CELL_SIZE * 0.1}px`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            {/* Ghosts eyes */}
                            <div className="w-full flex justify-around mt-1">
                                <div className="relative" style={{
                                    width: `${CELL_SIZE * 0.2}px`,
                                    height: `${CELL_SIZE * 0.2}px`
                                }}>
                                    <div className="absolute inset-0 bg-white rounded-full"></div>
                                    <div
                                        className="absolute bg-black rounded-full"
                                        style={{
                                            width: '50%',
                                            height: '50%',
                                            top: '50%',
                                            left: '50%',
                                            transform: ghost.isScared
                                                ? 'translate(-50%, -50%)'
                                                : `translate(${-50 + DIRECTIONS[ghost.direction].x * 25}%, ${-50 + DIRECTIONS[ghost.direction].y * 25}%)`
                                        }}
                                    />
                                </div>

                                <div className="relative" style={{
                                    width: `${CELL_SIZE * 0.2}px`,
                                    height: `${CELL_SIZE * 0.2}px`
                                }}>
                                    <div className="absolute inset-0 bg-white rounded-full"></div>
                                    <div
                                        className="absolute bg-black rounded-full"
                                        style={{
                                            width: '50%',
                                            height: '50%',
                                            top: '50%',
                                            left: '50%',
                                            transform: ghost.isScared
                                                ? 'translate(-50%, -50%)'
                                                : `translate(${-50 + DIRECTIONS[ghost.direction].x * 25}%, ${-50 + DIRECTIONS[ghost.direction].y * 25}%)`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Ghosts mouths */}
                            <div className="mb-1" style={{
                                width: `${CELL_SIZE * 0.4}px`,
                                height: `${CELL_SIZE * 0.15}px`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Ghosts mouths smile (normal) */}
                                {!ghost.isScared && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '70%',
                                        borderBottom: '3px solid black',
                                        borderRadius: '0 0 30px 30px',
                                    }}></div>
                                )}

                                {/* Ghosts mouths sad (scared) */}
                                {ghost.isScared && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '70%',
                                        borderTop: '3px solid black',
                                        borderRadius: '30px 30px 0 0',
                                    }}></div>
                                )}
                            </div>
                        </div>
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
                                <h2 className="text-retro-green font-retro text-4xl mb-6 text-center">HOW TO PLAY PACMAN</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-2xl mb-3">Objective</h3>
                                        <p className="text-white mb-4">
                                            Control Pacman to eat all the dots in the maze while avoiding the ghosts.
                                            Eat power pellets to temporarily turn the ghosts blue and vulnerable.
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-2xl mb-3">Scoring</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Small dot: 10 points</li>
                                            <li>• Power pellet: 50 points</li>
                                            <li>• Ghost (when vulnerable): 200 points</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-2xl mb-3">Controls</h3>
                                        <ul className="text-white space-y-3">
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move left/right</li>
                                            <li>• <span className="text-retro-blue">↑ ↓</span> or <span className="text-retro-blue">W/S</span>: Move up/down</li>
                                            <li>• <span className="text-retro-blue">Space</span> or <span className="text-retro-blue">P</span>: Pause/Resume</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-2xl mt-6 mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Game ends immediately if Pacman touches a ghost</li>
                                            <li>• Complete a level by eating all dots and pellets</li>
                                            <li>• Score carries over between levels</li>
                                            <li>• Power pellets make ghosts vulnerable for 5 seconds</li>
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
                    onClick={() => setPacman(prev => ({ ...prev, nextDirection: 'UP' }))}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    ↑
                </button>
                <div></div>

                <button
                    onClick={() => setPacman(prev => ({ ...prev, nextDirection: 'LEFT' }))}
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
                    onClick={() => setPacman(prev => ({ ...prev, nextDirection: 'RIGHT' }))}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    →
                </button>

                <div></div>
                <button
                    onClick={() => setPacman(prev => ({ ...prev, nextDirection: 'DOWN' }))}
                    className="bg-retro-purple text-white p-4 rounded"
                >
                    ↓
                </button>
                <div></div>
            </div>
        </div>
    )
}

export default PacmanGame