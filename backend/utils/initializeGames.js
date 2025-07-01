import Game from '../models/Game.js'

const initialGames = [
    {
        id: 1,
        name: 'Snake',
        description: 'Slither. Eat. Grow. Repeat',
        image: '/images/Snake.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    },
    {
        id: 2,
        name: 'Tetris',
        description: 'Fit fast. Think faster',
        image: '/images/Tetris.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    },
    {
        id: 3,
        name: 'Pacman',
        description: 'Eat dots. Dodge ghosts',
        image: '/images/Pacman.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    },
    {
        id: 4,
        name: 'Super Pang',
        description: 'Burst or be busted!',
        image: '/images/Superpang.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    },
    {
        id: 5,
        name: 'Connect Four',
        description: 'Four wins the war!',
        image: '/images/Connectfour.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    },
    {
        id: 6,
        name: 'Arkanoid',
        description: 'Smash. Bounce. Survive. Arkanoid',
        image: '/images/Arkanoid.jpg',
        likes: [],
        dislikes: [],
        highscores: [],
        messages: []
    }
]

export async function initializeGames() {
    try {
        const existingGames = await Game.find({})

        const existingGameNames = existingGames.map(game => game.name)

        const newGames = initialGames.filter(
            game => !existingGameNames.includes(game.name)
        )

        if (newGames.length > 0) {
            await Game.insertMany(newGames)
            console.log(`✅ ${newGames.length} new games inserted: ${newGames.map(g => g.name).join(', ')}`)
        } else {
            console.log('✅ There are no new games to insert')
        }
    } catch (error) {
        console.error('❌ Error initializing games:', error)
    }
}