import { connectDB } from './config/db.js'
import { initializeGames } from './utils/initializeGames.js'
import app from './app.js'

async function startServer() {
    await connectDB()
    await initializeGames()

    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

startServer()