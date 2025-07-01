import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitScore, getHighScore } from '../logic/scoreService'

const ROWS = 6
const COLS = 7
const CELL_SIZE = 80
const INITIAL_SPEED = 800
const WINNING_LENGTH = 4

const ConnectFourGame = () => {
    const location = useLocation()
    const gameId = parseInt(location.pathname.split('/')[2])
    const navigate = useNavigate()
    const { user } = useAuth()
    const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)))
    const [currentPlayer, setCurrentPlayer] = useState('red')
    const [gameOver, setGameOver] = useState(false)
    const [winner, setWinner] = useState(null)
    const [isPaused, setIsPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [showInstructions, setShowInstructions] = useState(true)
    const speedRef = useRef(INITIAL_SPEED)

    const initializeBoard = useCallback(() => {
        return Array(ROWS).fill().map(() => Array(COLS).fill(null))
    }, [])

    const isValidMove = useCallback((col) => {
        return board[0][col] === null
    }, [board])

    const advanceLevel = useCallback(() => {
        setBoard(initializeBoard())
        setCurrentPlayer('red')
        setGameOver(false)
        setWinner(null)
        setLevel(prevLevel => prevLevel + 1)
        speedRef.current = Math.max(100, INITIAL_SPEED - (level * 100))
    }, [initializeBoard, level])

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
        for (let row = ROWS - 1; row >= 0; row--) {
            if (newBoard[row][col] === null) {
                newBoard[row][col] = 'red'
                break
            }
        }

        setBoard(newBoard)
        checkWin(newBoard, 'red')
        setCurrentPlayer('yellow')
    }, [board, currentPlayer, gameOver, isPaused, isValidMove])

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
                for (let c = 0; c < COLS; c++) {
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
                for (let row = ROWS - 1; row >= 0; row--) {
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
    }, [board, currentPlayer, gameOver, isPaused, isValidMove, level])

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

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
                const line = board[row].slice(col, col + WINNING_LENGTH)
                const winIdx = checkLine(line)
                if (winIdx !== -1) {
                    const resultCol = col + winIdx
                    if (row === ROWS - 1 || board[row + 1][resultCol] !== null) {
                        return resultCol
                    }
                }
            }
        }

        for (let col = 0; col < COLS; col++) {
            for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
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

        for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
            for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
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
                    if (resultRow === ROWS - 1 || board[resultRow + 1][resultCol] !== null) {
                        return resultCol
                    }
                }

                const winIdxUR = checkLine(lineUR)
                if (winIdxUR !== -1) {
                    const resultCol = col + winIdxUR
                    const resultRow = row + WINNING_LENGTH - 1 - winIdxUR
                    if (resultRow === ROWS - 1 || board[resultRow + 1][resultCol] !== null) {
                        return resultCol
                    }
                }
            }
        }

        return null
    }, [])

    const findForkOpportunity = useCallback((board, player) => {
        if (level < 3) return null

        const forkThreshold = level > 5 ? 2 : 1
        const potentialMoves = []

        for (let col = 0; col < COLS; col++) {
            if (!isValidMove(col)) continue

            const testBoard = JSON.parse(JSON.stringify(board))
            for (let row = ROWS - 1; row >= 0; row--) {
                if (testBoard[row][col] === null) {
                    testBoard[row][col] = player
                    break
                }
            }

            let winningLinesCreated = 0
            for (let testCol = 0; testCol < COLS; testCol++) {
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
    }, [findWinningMove, isValidMove, level])

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
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, 0, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check vertical//
        for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
            for (let col = 0; col < COLS; col++) {
                if (checkDirection(row, col, 1, 0)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check diagonal (top-left to bottom-right)//
        for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
            for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, 1, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check diagonal (bottom-left to top-right)//
        for (let row = WINNING_LENGTH - 1; row < ROWS; row++) {
            for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
                if (checkDirection(row, col, -1, 1)) {
                    handleWin(player)
                    return
                }
            }
        }

        //Check for draw//
        if (board.every(row => row.every(cell => cell !== null))) {
            handleDraw()
        }
    }, [])

    const resetGame = useCallback(() => {
        setBoard(initializeBoard())
        setCurrentPlayer('red')
        setGameOver(false)
        setWinner(null)
        setScore(0)
        setLevel(1)
        setShowInstructions(false)
        speedRef.current = INITIAL_SPEED
    }, [initializeBoard])

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
            <div className="relative bg-blue-700 p-2 rounded-lg" style={{ padding: '10px' }}>
                <div className="flex mb-2">
                    {Array(COLS).fill().map((_, col) => (
                        <div
                            key={`indicator-${col}`}
                            className="flex-1 text-center text-white font-bold cursor-pointer hover:bg-blue-600 rounded"
                            onClick={() => makeMove(col)}
                            style={{ fontSize: '1.2rem', padding: '5px 0' }}
                        >
                            {col + 1}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1" style={{ gap: '4px' }}>
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
            <div className="bg-retro-purple p-4 flex justify-between items-center">
                <div className="font-retro text-white text-xl">
                    Score: <span className="text-retro-yellow">{score}</span> |
                    High Score: <span className="text-retro-green">{highScore}</span> |
                    Level: <span className="text-retro-blue">{level}</span> |
                    Turn: <span className={currentPlayer === 'red' ? 'text-red-500' : 'text-yellow-400'}>
                        {currentPlayer === 'red' ? 'Player' : 'CPU'}
                    </span>
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

            <div className="flex-1 flex flex-col items-center justify-center p-2">
                <div
                    className="relative bg-black border-4 border-retro-green rounded-lg"
                    style={{
                        width: `${COLS * CELL_SIZE - 20}px`,
                        height: `${ROWS * CELL_SIZE + 60}px`,
                        padding: '10px'
                    }}
                >
                    {renderBoard()}

                    {gameOver && winner !== 'red' && (
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
                                <h2 className="text-retro-green font-retro text-4xl mb-6 text-center">HOW TO PLAY CONNECT FOUR</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="text-retro-blue font-retro text-2xl mb-3">Objective</h3>
                                        <p className="text-white mb-4">
                                            Connect four of your discs in a row (horizontally, vertically, or diagonally) before the CPU does.
                                        </p>
                                        <h3 className="text-retro-pink font-retro text-2xl mb-3">Scoring</h3>
                                        <ul className="text-white space-y-2">
                                            <li>• Win: +100 points × level</li>
                                            <li>• CPU gets smarter each level</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-retro-yellow font-retro text-2xl mb-3">Controls</h3>
                                        <ul className="text-white space-y-3">
                                            <li>• <span className="text-retro-blue">1-7</span> keys: Drop disc</li>
                                            <li>• <span className="text-retro-blue">Click</span> column number</li>
                                            <li>• <span className="text-retro-blue">P</span>: Pause game</li>
                                        </ul>

                                        <h3 className="text-retro-pink font-retro text-2xl mt-6 mb-3">Game Rules</h3>
                                        <ul className="text-white space-y-2">
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

            <div className="md:hidden bg-retro-dark p-4 grid grid-cols-7 gap-1">
                {Array(COLS).fill().map((_, col) => (
                    <button
                        key={`mobile-btn-${col}`}
                        onClick={() => makeMove(col)}
                        className="bg-retro-purple text-white p-3 rounded font-bold"
                        style={{ fontSize: '1.1rem' }}
                    >
                        {col + 1}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ConnectFourGame