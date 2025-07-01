import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    image: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    highscores: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true }
    }],
    messages: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
})

gameSchema.index({ id: 1 })

export default mongoose.model('Game', gameSchema)