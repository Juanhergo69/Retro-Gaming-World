import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const getGameDimensions = () => {
    if (window.innerWidth <= 640) { //Mobile//
        return {
            rows: 6,
            cols: 7,
            cellSize: Math.min(Math.floor(window.innerWidth * 0.9 / 7), 60),
            speed: 600
        }
    } else if (window.innerWidth <= 1024) { //Tablet//
        return {
            rows: 6,
            cols: 7,
            cellSize: 70,
            speed: 800
        }
    } else { //Desktop//
        return {
            rows: 6,
            cols: 7,
            cellSize: 80,
            speed: 800
        }
    }
}

const WINNING_LENGTH = 4

const ConnectFourGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [dimensions, setDimensions] = useState(getGameDimensions())
    const [board, setBoard] = useState(
        Array(dimensions.rows).fill().map(() => Array(dimensions.cols).fill(null)))
    const [currentPlayer, setCurrentPlayer] = useState('red')
    const [gameOver, setGameOver] = useState(false)
    const [winner, setWinner] = useState(null)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [showInstructions, setShowInstructions] = useState(true)
    const speedRef = useRef(dimensions.speed)

    useEffect(() => {
        const handleResize = () => {
            const newDimensions = getGameDimensions()
            setDimensions(newDimensions)
            speedRef.current = newDimensions.speed

            setBoard(
                Array(newDimensions.rows).fill().map(() => Array(newDimensions.cols).fill(null))
            )
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const initializeBoard = useCallback(() => {
        return Array(dimensions.rows).fill().map(() => Array(dimensions.cols).fill(null))
    }, [dimensions])

    const isValidMove = useCallback((col) => {
        return board[0][col] === null
    }, [board])

    const advanceLevel = useCallback(() => {
        setBoard(initializeBoard())
        setCurrentPlayer('red')
        setGameOver(false)
        setWinner(null)
        setLevel(prevLevel => prevLevel + 1)
        speedRef.current = Math.max(100, dimensions.speed - (level * 100))
    }, [initializeBoard, level, dimensions.speed])

    const handleWin = useCallback((player) => {
        setGameOver(true)
        setWinner(player)

        if (player === 'red') {
            setScore(prevScore => {
                const newScore = prevScore + (100 * level)
                if (newScore > highScore) setHighScore(newScore)
                return newScore
            })

            setTimeout(advanceLevel, 1000)
        }
    }, [highScore, level, advanceLevel])

    const makeMove = useCallback((col) => {
        if (gameOver || isPaused || currentPlayer !== 'red' || !isValidMove(col)) return

        const newBoard = [...board]
        for (let row = dimensions.rows - 1; row >= 0; row--) {
            if (newBoard[row][col] === null) {
                newBoard[row][col] = 'red'
                break
            }
        }

        setBoard(newBoard)
        checkWin(newBoard, 'red')
        setCurrentPlayer('yellow')
    }, [board, currentPlayer, gameOver, isPaused, isValidMove, dimensions.rows])

    const makeCpuMove = useCallback(() => {
        if (gameOver || isPaused || currentPlayer !== 'yellow') return

        let col = null
        const strategies = [
            //Check if CPU can win immediately//
            () => findWinningMove(board, 'yellow'),

            //Block player if they can win next move//
            () => findWinningMove(board, 'red'),

            //Create multiple opportunities (forks)//
            () => findForkOpportunity(board, 'yellow'),

            //Block player's fork opportunities//
            () => findForkOpportunity(board, 'red'),

            //Strategic center preference with level-based variations//
            () => {
                const variations = [
                    [3, 2, 4, 1, 5, 0, 6],   //Basic center preference//
                    [3, 4, 2, 5, 1, 6, 0],   //Right bias//
                    [3, 2, 4, 1, 5, 0, 6],   //Left bias//
                    [3, 4, 2, 1, 5, 0, 6]    //Mixed//
                ]

                const strategyIndex = Math.min(level - 1, variations.length - 1)
                for (const c of variations[strategyIndex]) {
                    if (isValidMove(c)) return c
                }
                return null
            },

            //Random valid move as fallback//
            () => {
                const validColumns = []
                for (let c = 0; c < dimensions.cols; c++) {
                    if (isValidMove(c)) validColumns.push(c)
                }
                return validColumns.length > 0
                    ? validColumns[Math.floor(Math.random() * validColumns.length)]
                    : null
            }
        ]

        //Try strategies in order until we find a move//
        for (const strategy of strategies) {
            col = strategy()
            if (col !== null && isValidMove(col)) break
        }

        if (col !== null) {
            setTimeout(() => {
                const newBoard = [...board]
                for (let row = dimensions.rows - 1; row >= 0; row--) {
                    if (newBoard[row][col] === null) {
                        newBoard[row][col] = 'yellow'
                        break
                    }
                }

                setBoard(newBoard)
                checkWin(newBoard, 'yellow')
                setCurrentPlayer('red')
            }, Math.max(100, 600 - (level * 50)))
        }
    }, [board, currentPlayer, gameOver, isPaused, isValidMove, level, dimensions])

    const findWinningMove = useCallback((board, player) => {
        const checkLine = (cells) => {
            const playerCount = cells.filter(c => c === player).length
            const emptyCount = cells.filter(c => c === null).length
            if (playerCount === WINNING_LENGTH - 1 && emptyCount === 1) {
                return cells.findIndex((c, i) => c === null &&
                    (i === 0 || cells[i - 1] !== null))
            }
            return -1
        }

        for (let row = 0; row < dimensions.rows; row++) {
            for (let col = 0; col <= dimensions.cols - WINNING_LENGTH; col++) {
                const line = board[row].slice(col, col + WINNING_LENGTH)
                const winIdx = checkLine(line)
                if (winIdx !== -1) {
                    const resultCol = col + winIdx
                    if (row === dimensions.rows - 1 || board[row + 1][resultCol] !== null) {
                        return resultCol
                    }
                }
            }
        }

        for (let col = 0; col < dimensions.cols; col++) {
            for (let row = 0; row <= dimensions.rows - WINNING_LENGTH; row++) {
                const line = []
                for (let i = 0; i < WINNING_LENGTH; i++) {
                    line.push(board[row + i][col])
                }
                const winIdx = checkLine(line)
                if (winIdx !== -1) {
                    return col
                }
            }
        }

        for (let row = 0; row <= dimensions.rows - WINNING_LENGTH; row++) {
            for (let col = 0; col <= dimensions.cols - WINNING_LENGTH; col++) {
                const lineDR = []
                const lineUR = []
                for (let i = 0; i < WINNING_LENGTH; i++) {
                    lineDR.push(board[row + i][col + i])
                    lineUR.push(board[row + WINNING_LENGTH - 1 - i][col + i])
                }

                const winIdxDR = checkLine(lineDR)
                if (winIdxDR !== -1) {
                    const resultCol = col + winIdxDR
                    const resultRow = row + winIdxDR
                    if (resultRow === dimensions.rows - 1 || board[resultRow + 1][resultCol] !== null) {
                        return resultCol
                    }
                }

                const winIdxUR = checkLine(lineUR)
                if (winIdxUR !== -1) {
                    const resultCol = col + winIdxUR
                    const resultRow = row + WINNING_LENGTH - 1 - winIdxUR
                    if (resultRow === dimensions.rows - 1 || board[resultRow + 1][resultCol] !== null) {
                        return resultCol
                    }
                }
            }
        }

        return null
    }, [dimensions])

    const findForkOpportunity = useCallback((board, player) => {
        if (level < 3) return null

        const forkThreshold = level > 5 ? 2 : 1
        const potentialMoves = []

        for (let col = 0; col < dimensions.cols; col++) {
            if (!isValidMove(col)) continue

            const testBoard = JSON.parse(JSON.stringify(board))
            for (let row = dimensions.rows - 1; row >= 0; row--) {
                if (testBoard[row][col] === null) {
                    testBoard[row][col] = player
                    break
                }
            }

            let winningLinesCreated = 0
            for (let testCol = 0; testCol < dimensions.cols; testCol++) {
                if (findWinningMove(testBoard, player) === testCol) {
                    winningLinesCreated++
                }
            }

            if (winningLinesCreated >= forkThreshold) {
                potentialMoves.push({ col, score: winningLinesCreated })
            }
        }

        if (potentialMoves.length > 0) {
            potentialMoves.sort((a, b) => b.score - a.score)
            return potentialMoves[0].col
        }

        return null
    }, [findWinningMove, isValidMove, level, dimensions])

    const checkWin = useCallback((board, player) => {
        //Check all directions for a win//
        const checkDirection = (startRow, startCol, deltaRow, deltaCol) => {
            for (let i = 0; i < WINNING_LENGTH; i++) {
                const row = startRow + i * deltaRow
                const col = startCol + i * deltaCol
                if (board[row][col] !== player) return false
            }
            return true
        }

        //Check horizontal//
        for (let row = 0; row < dimensions.rows; row++) {
            for (let col = 0; col <= dimensions.cols - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, 0, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check vertical//
        for (let row = 0; row <= dimensions.rows - WINNING_LENGTH; row++) {
            for (let col = 0; col < dimensions.cols; col++) {
                if (checkDirection(row, col, 1, 0)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check diagonal (top-left to bottom-right)//
        for (let row = 0; row <= dimensions.rows - WINNING_LENGTH; row++) {
            for (let col = 0; col <= dimensions.cols - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, 1, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check diagonal (bottom-left to top-right)//
        for (let row = WINNING_LENGTH - 1; row < dimensions.rows; row++) {
            for (let col = 0; col <= dimensions.cols - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, -1, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check for draw//
        if (board.every(row => row.every(cell => cell !== null))) {
            setGameOver(true)
            setWinner('draw')
        }
    }, [dimensions, handleWin])

    const resetGame = useCallback(() => {
        setBoard(initializeBoard())
        setCurrentPlayer('red')
        setGameOver(false)
        setWinner(null)
        setScore(0)
        setLevel(1)
        setShowInstructions(false)
        speedRef.current = dimensions.speed
    }, [initializeBoard, dimensions])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver || showInstructions) return

            if (e.key >= '1' && e.key <= '7') {
                const col = parseInt(e.key) - 1
                makeMove(col)
            } else if (e.key.toLowerCase() === 'p') {
                setIsPaused(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [gameOver, showInstructions, makeMove])

    useEffect(() => {
        if (!gameOver && !isPaused && currentPlayer === 'yellow') {
            const timer = setTimeout(() => {
                makeCpuMove()
            }, speedRef.current)

            return () => clearTimeout(timer)
        }
    }, [currentPlayer, gameOver, isPaused, makeCpuMove])

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

    const renderBoard = () => {
        return (
            <div className="relative bg-blue-700 p-1 sm:p-2 rounded-lg">
                {/* Column indicators */}
                <div className="flex mb-1 sm:mb-2">
                    {Array(dimensions.cols).fill().map((_, col) => (
                        <div
                            key={`indicator-${col}`}
                            className="flex-1 text-center text-white font-bold cursor-pointer hover:bg-blue-600 rounded"
                            onClick={() => makeMove(col)}
                            style={{
                                fontSize: `${Math.min(dimensions.cellSize * 0.3, 20)}px`,
                                padding: '3px 0'
                            }}
                        >
                            {col + 1}
                        </div>
                    ))}
                </div>

                {/* Game board */}
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateColumns: `repeat(${dimensions.cols}, 1fr)`,
                        gap: '2px'
                    }}
                >
                    {board.map((row, rowIndex) => (
                        row.map((cell, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className={`rounded-full border-2 border-blue-800 flex items-center justify-center
                                    ${cell === 'red' ? 'bg-red-500' :
                                        cell === 'yellow' ? 'bg-yellow-400' : 'bg-white'}`}
                                style={{
                                    width: '100%',
                                    height: '0',
                                    paddingBottom: '100%',
                                    cursor: 'pointer'
                                }}
                                onClick={() => makeMove(colIndex)}
                            />
                        ))
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-retro-dark flex flex-col">
            {/* Header with game info */}
            <div className="bg-retro-purple p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-center">
                <div className="font-retro text-white text-sm sm:text-xl mb-2 sm:mb-0 text-center sm:text-left">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High: <span className="text-retro-green">{highScore}</span> |
                    Level: <span className="text-retro-blue">{level}</span> |
                    Turn: <span className={currentPlayer === 'red' ? 'text-red-500' : 'text-yellow-400'}>
                        {currentPlayer === 'red' ? 'You' : 'CPU'}
                    </span>
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

            {/* Main game area */}
            <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 overflow-auto">
                <div
                    className="relative bg-black border-4 border-retro-green rounded-lg"
                    style={{
                        width: `${dimensions.cols * dimensions.cellSize + 20}px`,
                        maxWidth: '95vw',
                        padding: '8px'
                    }}
                >
                    {renderBoard()}

                    {/* Game over overlay */}
                    {gameOver && winner !== 'red' && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                            <h2 className="text-retro-pink font-retro text-2xl sm:text-4xl mb-4 sm:mb-6">
                                {winner === 'draw' ? 'DRAW!' : 'GAME OVER'}
                            </h2>
                            <p className="text-white text-lg sm:text-xl mb-3 sm:mb-4">Your score: {score}</p>
                            <button
                                onClick={resetGame}
                                className="bg-retro-yellow hover:bg-retro-yellow-dark text-retro-dark font-retro px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-lg sm:text-xl"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {/* Paused overlay */}
                    {isPaused && !gameOver && !showInstructions && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <h2 className="text-retro-blue font-retro text-2xl sm:text-4xl">PAUSED</h2>
                        </div>
                    )}

                    {/* Instructions overlay */}
                    {showInstructions && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
                            <div className="bg-retro-dark border-4 border-retro-yellow rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 overflow-y-auto max-h-[90vh]">
                                <h2 className="text-retro-green font-retro text-2xl sm:text-4xl mb-4 sm:mb-6 text-center">
                                    HOW TO PLAY CONNECT FOUR
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-xl sm:text-2xl mb-2 sm:mb-3">Objective</h3>
                                        <p className="text-white mb-3 sm:mb-4 text-sm sm:text-base">
                                            Connect four of your discs in a row (horizontally, vertically, or diagonally) before the CPU does.
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-xl sm:text-2xl mb-2 sm:mb-3">Scoring</h3>
                                        <ul className="text-white space-y-1 sm:space-y-2 text-sm sm:text-base">
                                            <li>• Win: +100 points × level</li>
                                            <li>• CPU gets smarter each level</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-xl sm:text-2xl mb-2 sm:mb-3">Controls</h3>
                                        <ul className="text-white space-y-1 sm:space-y-3 text-sm sm:text-base">
                                            <li>• <span className="text-retro-blue">1-7</span> keys: Drop disc</li>
                                            <li>• <span className="text-retro-blue">Click</span> column number</li>
                                            <li>• <span className="text-retro-blue">Touch</span> buttons on mobile</li>
                                            <li>• <span className="text-retro-blue">P</span>: Pause game</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-xl sm:text-2xl mt-4 sm:mt-6 mb-2 sm:mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-1 sm:space-y-2 text-sm sm:text-base">
                                            <li>• Red discs: You</li>
                                            <li>• Yellow discs: CPU</li>
                                            <li>• Win to automatically advance</li>
                                            <li>• Lose to CPU ends the game</li>
                                            <li>• Higher levels = smarter CPU</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={startGame}
                                        className="bg-retro-pink hover:bg-retro-pink-dark text-white font-retro px-6 py-2 sm:px-8 sm:py-3 rounded-lg text-lg sm:text-xl"
                                    >
                                        START GAME
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile controls */}
            <div className="md:hidden bg-retro-dark p-2 grid grid-cols-7 gap-1">
                {Array(dimensions.cols).fill().map((_, col) => (
                    <button
                        key={`mobile-btn-${col}`}
                        onClick={() => makeMove(col)}
                        className="bg-retro-purple text-white p-2 rounded font-bold active:bg-retro-purple-dark"
                        style={{ fontSize: `${Math.min(dimensions.cellSize * 0.3, 18)}px` }}
                    >
                        {col + 1}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ConnectFourGame