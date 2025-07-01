import { connectDB, closeDB } from '../config/db.js'
import { initializeGames } from '../utils/initializeGames.js'

before(async () => {
    await connectDB()
    await initializeGames()
})

after(async () => {
    await closeDB()
})