import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService/'

const COLS = 10
const ROWS = 16
const INITIAL_SPEED = 800
const SPEED_DECREMENT = 50
const LINES_PER_LEVEL = 10

const SHAPES = [
    [[1, 1, 1, 1]],         //I//
    [[2, 0, 0], [2, 2, 2]], //J//
    [[0, 0, 3], [3, 3, 3]], //L//
    [[4, 4], [4, 4]],       //O//
    [[0, 5, 5], [5, 5, 0]], //S//
    [[0, 6, 0], [6, 6, 6]], //T//
    [[7, 7, 0], [0, 7, 7]]  //Z//
]

const COLORS = [
    'bg-transparent',
    'bg-cyan-500',   //I//
    'bg-blue-600',   //J//
    'bg-orange-500', //L//
    'bg-yellow-400', //O//
    'bg-green-500',  //S//
    'bg-purple-600', //T//
    'bg-red-500'     //Z//
]

const TetrisControlButton = ({
    children,
    onClick,
    ariaLabel,
    className,
    isActive = true
}) => {
    const buttonRef = useRef(null)

    useEffect(() => {
        const button = buttonRef.current
        if (!button) return

        const handleTouchStart = (e) => {
            if (isActive) {
                e.preventDefault()
                onClick()
            }
        }

        const handleContextMenu = (e) => {
            e.preventDefault()
        }

        button.addEventListener('touchstart', handleTouchStart, { passive: false })
        button.addEventListener('contextmenu', handleContextMenu)

        return () => {
            button.removeEventListener('touchstart', handleTouchStart)
            button.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [onClick, isActive])

    return (
        <button
            ref={buttonRef}
            className={`${className} touch-none select-none ${!isActive ? 'opacity-50' : 'active:opacity-80'}`}
            aria-label={ariaLabel}
            onClick={isActive ? onClick : undefined}
            onMouseDown={(e) => isActive && e.preventDefault()}
        >
            {children}
        </button>
    )
}

const TetrisGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [board, setBoard] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)))
    const [currentPiece, setCurrentPiece] = useState(null)
    const [nextPiece, setNextPiece] = useState(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const [showInstructions, setShowInstructions] = useState(true)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const gameLoopRef = useRef()
    const speedRef = useRef(INITIAL_SPEED)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

    const createEmptyBoard = useCallback(() => {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    }, [])

    const getRandomPiece = useCallback(() => {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length)
        return {
            shape: SHAPES[shapeIndex],
            color: COLORS[shapeIndex + 1],
            width: SHAPES[shapeIndex][0].length,
            height: SHAPES[shapeIndex].length
        }
    }, [])

    const initGame = useCallback(() => {
        const emptyBoard = createEmptyBoard()
        setBoard(emptyBoard)
        setScore(0)
        setLevel(1)
        setLines(0)
        setGameOver(false)
        setIsPaused(false)
        speedRef.current = INITIAL_SPEED

        const firstPiece = getRandomPiece()
        const secondPiece = getRandomPiece()

        setCurrentPiece(firstPiece)
        setNextPiece(secondPiece)
        setPosition({
            x: Math.floor(COLS / 2) - Math.floor(firstPiece.width / 2),
            y: 0
        })
    }, [createEmptyBoard, getRandomPiece])

    const checkCollision = useCallback((pieceShape, x, y) => {
        for (let row = 0; row < pieceShape.length; row++) {
            for (let col = 0; col < pieceShape[row].length; col++) {
                if (pieceShape[row][col] !== 0) {
                    const newX = x + col
                    const newY = y + row

                    if (newX < 0 || newX >= COLS || newY >= ROWS ||
                        (newY >= 0 && board[newY][newX] !== 0)) {
                        return true
                    }
                }
            }
        }
        return false
    }, [board])

    const rotatePiece = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return

        const newShape = currentPiece.shape[0].map((_, i) =>
            currentPiece.shape.map(row => row[i]).reverse()
        )

        if (!checkCollision(newShape, position.x, position.y)) {
            setCurrentPiece(prev => ({
                ...prev,
                shape: newShape,
                width: newShape[0].length,
                height: newShape.length
            }))
        }
    }, [currentPiece, position, gameOver, isPaused, checkCollision])

    const checkLines = useCallback((currentBoard) => {
        let linesCleared = 0
        const newBoard = currentBoard.map(row => [...row])

        for (let row = ROWS - 1; row >= 0; row--) {
            if (newBoard[row].every(cell => cell !== 0)) {
                newBoard.splice(row, 1)
                newBoard.unshift(Array(COLS).fill(0))
                linesCleared++
                row++
            }
        }

        return { clearedBoard: newBoard, linesCleared }
    }, [])

    const placePiece = useCallback(() => {
        if (!currentPiece || gameOver) return

        const newBoard = board.map(row => [...row])
        let piecePlaced = false

        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col] !== 0) {
                    const y = position.y + row
                    const x = position.x + col

                    if (y < 0) {
                        setGameOver(true)
                        return
                    }

                    newBoard[y][x] = currentPiece.color
                    piecePlaced = true
                }
            }
        }

        if (piecePlaced) {
            const { clearedBoard, linesCleared } = checkLines(newBoard)
            setBoard(clearedBoard)

            if (linesCleared > 0) {
                setLines(prev => prev + linesCleared)
                const points = [0, 100, 300, 500, 800][linesCleared] * level
                setScore(prev => {
                    const newScore = prev + points
                    if (newScore > highScore) setHighScore(newScore)
                    return newScore
                })

                if (lines + linesCleared >= level * LINES_PER_LEVEL) {
                    setLevel(prev => prev + 1)
                    speedRef.current = Math.max(INITIAL_SPEED - (level * SPEED_DECREMENT), 100)
                }
            }

            setCurrentPiece(nextPiece)
            setNextPiece(getRandomPiece())
            const newX = Math.floor(COLS / 2) - Math.floor(nextPiece.width / 2)
            setPosition({ x: newX, y: 0 })

            if (checkCollision(nextPiece.shape, newX, 0)) {
                setGameOver(true)
            }
        }
    }, [currentPiece, board, position, nextPiece, gameOver, getRandomPiece, checkLines, level, lines, highScore, checkCollision])

    const movePiece = useCallback((direction) => {
        if (!currentPiece || gameOver || isPaused) return false

        let newX = position.x
        let newY = position.y

        switch (direction) {
            case 'left': newX--; break
            case 'right': newX++; break
            case 'down': newY++; break
            default: break
        }

        if (!checkCollision(currentPiece.shape, newX, newY)) {
            setPosition({ x: newX, y: newY })
            return true
        }

        if (direction === 'down') {
            placePiece()
            return false
        }

        return false
    }, [currentPiece, position, gameOver, isPaused, checkCollision, placePiece])

    const hardDrop = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return

        let newY = position.y
        while (
            newY < ROWS - currentPiece.height &&
            !checkCollision(currentPiece.shape, position.x, newY + 1)
        ) {
            newY++
        }

        const newBoard = board.map(row => [...row])

        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col] !== 0) {
                    const y = newY + row
                    const x = position.x + col
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                        newBoard[y][x] = currentPiece.color
                    }
                }
            }
        }

        const { clearedBoard, linesCleared } = checkLines(newBoard)
        setBoard(clearedBoard)

        if (linesCleared > 0) {
            setLines(prev => prev + linesCleared)
            const points = [0, 100, 300, 500, 800][linesCleared] * level
            setScore(prev => {
                const newScore = prev + points
                if (newScore > highScore) setHighScore(newScore)
                return newScore
            })

            if (lines + linesCleared >= level * LINES_PER_LEVEL) {
                setLevel(prev => prev + 1)
                speedRef.current = Math.max(INITIAL_SPEED - (level * SPEED_DECREMENT), 100)
            }
        }

        setCurrentPiece(nextPiece)
        setNextPiece(getRandomPiece())
        const nextX = Math.floor(COLS / 2) - Math.floor(nextPiece.width / 2)
        setPosition({ x: nextX, y: 0 })

        if (checkCollision(nextPiece.shape, nextX, 0)) {
            setGameOver(true)
        }
    }, [currentPiece, position, gameOver, isPaused, checkCollision, board, checkLines, level, lines, highScore, nextPiece, getRandomPiece])

    const dropPiece = useCallback(() => {
        if (gameOver || isPaused || showInstructions) return
        movePiece('down')
    }, [movePiece, gameOver, isPaused, showInstructions])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver || showInstructions) return

            const gameKeys = [
                'arrowleft', 'a', 'arrowright', 'd',
                'arrowdown', 's', 'arrowup', 'w',
                ' ', 'p'
            ]

            if (gameKeys.includes(e.key.toLowerCase())) {
                e.preventDefault()
            }

            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    movePiece('left')
                    break
                case 'arrowright':
                case 'd':
                    movePiece('right')
                    break
                case 'arrowdown':
                case 's':
                    movePiece('down')
                    break
                case 'arrowup':
                case 'w':
                    rotatePiece()
                    break
                case ' ':
                    hardDrop()
                    break
                case 'p':
                    setIsPaused(prev => !prev)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [movePiece, rotatePiece, gameOver, showInstructions, hardDrop])

    useEffect(() => {
        if (!gameOver && !showInstructions && !isPaused) {
            gameLoopRef.current = setInterval(dropPiece, speedRef.current)
            return () => {
                if (gameLoopRef.current) {
                    clearInterval(gameLoopRef.current)
                }
            }
        }
    }, [dropPiece, gameOver, showInstructions, isPaused])

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

    const renderBoard = () => {
        const displayBoard = board.map(row => [...row])

        if (currentPiece && !gameOver && !isPaused) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col] !== 0) {
                        const y = position.y + row
                        const x = position.x + col
                        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                            displayBoard[y][x] = currentPiece.color
                        }
                    }
                }
            }
        }

        return (
            <div
                className="absolute inset-0 grid"
                style={{
                    gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`
                }}
            >
                {displayBoard.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`${cell || 'bg-black'} border border-gray-800`}
                        />
                    ))
                ))}
            </div>
        )
    }

    const renderNextPiece = () => {
        if (!nextPiece) return null

        return (
            <div className="flex flex-col items-center justify-center p-2">
                <h3 className="text-retro-blue font-retro text-lg mb-2 text-center">Next</h3>
                <div className="bg-black p-2 rounded w-full">
                    <div
                        className="grid mx-auto"
                        style={{
                            gridTemplateRows: `repeat(${nextPiece.height}, ${isMobile ? '20px' : '20px'})`,
                            gridTemplateColumns: `repeat(${nextPiece.width}, ${isMobile ? '20px' : '20px'})`,
                            width: `${nextPiece.width * (isMobile ? 20 : 20)}px`
                        }}
                    >
                        {nextPiece.shape.map((row, rowIndex) => (
                            row.map((cell, colIndex) => (
                                <div
                                    key={`next-${rowIndex}-${colIndex}`}
                                    className={`${cell ? nextPiece.color : 'bg-transparent'} border border-gray-800`}
                                />
                            ))
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const startGame = () => {
        setShowInstructions(false)
        initGame()
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col overflow-hidden">
            <div className={`bg-retro-purple ${isMobile ? 'p-2' : 'p-4'} flex ${isMobile ? 'flex-col' : 'justify-between items-center'}`}>
                <div className={`font-retro text-white ${isMobile ? 'text-sm text-center mb-1' : 'text-xl'}`}>
                    Score: <span className="text-retro-yellow">{score}</span> |
                    {!isMobile && ' High: '}<span className="text-retro-green">{highScore}</span> |
                    {!isMobile && ' Level: '}<span className="text-retro-blue">{level}</span> |
                    <span className="text-retro-pink"> {lines}</span>
                </div>

                <div className={`flex ${isMobile ? 'justify-center space-x-2 mt-1' : 'space-x-3'}`}>
                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className={`bg-retro-blue text-white font-retro ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 rounded'}`}
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className={`bg-retro-pink text-white font-retro ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 rounded'}`}
                    >
                        Exit
                    </button>
                </div>
            </div>

            <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-center p-2 gap-4 overflow-hidden`}>
                <div
                    className="relative bg-black border-4 border-retro-green touch-none"
                    style={{
                        width: `${COLS * (isMobile ? 25 : 30)}px`,
                        height: `${ROWS * (isMobile ? 25 : 30)}px`,
                        maxHeight: isMobile ? '65vh' : 'none',
                        boxSizing: 'content-box'
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {renderBoard()}

                    {gameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                            <h2 className={`text-retro-pink font-retro ${isMobile ? 'text-2xl' : 'text-4xl'} mb-4 text-center`}>GAME OVER</h2>
                            <p className={`text-white ${isMobile ? 'text-sm' : 'text-xl'} mb-4`}>Your score: {score}</p>
                            <button
                                onClick={initGame}
                                className={`bg-retro-yellow text-retro-dark font-retro ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-xl'} rounded-lg`}
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {isPaused && !gameOver && !showInstructions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <h2 className={`text-retro-blue font-retro ${isMobile ? 'text-2xl' : 'text-4xl'}`}>PAUSED</h2>
                        </div>
                    )}
                </div>

                <div className={`flex ${isMobile ? 'flex-row w-full justify-between mt-2' : 'flex-col'} gap-4`}>
                    <div className={`bg-retro-dark border-2 border-retro-blue rounded-lg ${isMobile ? 'w-[48%]' : 'w-full min-w-[120px]'
                        }`}>
                        {renderNextPiece()}
                    </div>

                    {isMobile && (
                        <div className="w-full bg-retro-dark p-2 grid grid-cols-3 gap-1 touch-none">
                            <div></div>
                            <TetrisControlButton
                                onClick={rotatePiece}
                                ariaLabel="Rotate piece"
                                className="bg-retro-purple text-white p-2 rounded-md text-lg"
                                isActive={!gameOver && !isPaused && !showInstructions}
                            >
                                ↻
                            </TetrisControlButton>
                            <div></div>

                            <TetrisControlButton
                                onClick={() => movePiece('left')}
                                ariaLabel="Move left"
                                className="bg-retro-purple text-white p-2 rounded-md text-lg"
                                isActive={!gameOver && !isPaused && !showInstructions}
                            >
                                ←
                            </TetrisControlButton>

                            <button
                                onClick={() => setIsPaused(prev => !prev)}
                                className="bg-retro-blue text-white p-2 rounded-md text-lg active:bg-retro-blue-dark"
                                aria-label={isPaused ? 'Resume' : 'Pause'}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {isPaused ? '▶' : '⏸'}
                            </button>

                            <TetrisControlButton
                                onClick={() => movePiece('right')}
                                ariaLabel="Move right"
                                className="bg-retro-purple text-white p-2 rounded-md text-lg"
                                isActive={!gameOver && !isPaused && !showInstructions}
                            >
                                →
                            </TetrisControlButton>

                            <div></div>
                            <TetrisControlButton
                                onClick={() => movePiece('down')}
                                ariaLabel="Move down"
                                className="bg-retro-purple text-white p-2 rounded-md text-lg"
                                isActive={!gameOver && !isPaused && !showInstructions}
                            >
                                ↓
                            </TetrisControlButton>
                            <TetrisControlButton
                                onClick={hardDrop}
                                ariaLabel="Hard drop"
                                className="bg-retro-yellow text-retro-dark p-2 rounded-md text-lg"
                                isActive={!gameOver && !isPaused && !showInstructions}
                            >
                                ⬇
                            </TetrisControlButton>
                        </div>
                    )}
                </div>
            </div>

            {showInstructions && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2">
                    <div className={`bg-retro-dark border-4 border-retro-yellow rounded-lg ${isMobile ? 'p-4' : 'p-6'} max-w-2xl w-full mx-2 overflow-y-auto max-h-[90vh]`}>
                        <h2 className={`text-retro-green font-retro ${isMobile ? 'text-2xl' : 'text-4xl'} mb-4 text-center`}>HOW TO PLAY TETRIS</h2>

                        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-4`}>
                            <div>
                                <h3 className={`text-retro-blue font-retro ${isMobile ? 'text-lg' : 'text-2xl'} mb-2`}>Objective</h3>
                                <p className={`text-white ${isMobile ? 'text-sm' : 'mb-4'}`}>
                                    Arrange the falling blocks to complete horizontal lines.
                                    Each completed line will clear and earn you points.
                                </p>
                                <h3 className={`text-retro-pink font-retro ${isMobile ? 'text-lg' : 'text-2xl'} mb-2`}>Scoring</h3>
                                <ul className={`text-white ${isMobile ? 'text-xs space-y-1' : 'space-y-2'}`}>
                                    <li>• 1 line: 100 × level</li>
                                    <li>• 2 lines: 300 × level</li>
                                    <li>• 3 lines: 500 × level</li>
                                    <li>• 4 lines: 800 × level</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className={`text-retro-yellow font-retro ${isMobile ? 'text-lg' : 'text-2xl'} mb-2`}>Controls</h3>
                                <ul className={`text-white ${isMobile ? 'text-xs space-y-1' : 'space-y-3'}`}>
                                    {isMobile ? (
                                        <>
                                            <li>• Left/Right buttons to move</li>
                                            <li>• ↻ button to rotate</li>
                                            <li>• ↓ button for soft drop</li>
                                            <li>• ⬇ button for hard drop</li>
                                            <li>• ⏸ button to pause</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>• <span className="text-retro-blue">← →</span> or <span className="text-retro-blue">A/D</span>: Move piece</li>
                                            <li>• <span className="text-retro-blue">↓</span> or <span className="text-retro-blue">S</span>: Soft drop</li>
                                            <li>• <span className="text-retro-blue">↑</span> or <span className="text-retro-blue">W</span>: Rotate piece</li>
                                            <li>• <span className="text-retro-blue">Space</span>: Hard drop (instant)</li>
                                            <li>• <span className="text-retro-blue">P</span>: Pause/Resume game</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={startGame}
                                className={`bg-retro-pink text-white font-retro ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-3 text-xl'} rounded-lg`}
                            >
                                START GAME
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TetrisGame