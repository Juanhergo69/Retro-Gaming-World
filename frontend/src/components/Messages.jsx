import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { useEffect, useState } from 'react'
import { formatMessageTime, truncateUsername } from '../utils/helpers'
import { fetchUserData } from '../logic/fetchUserData'
import { fetchGameMessages, postGameMessage, deleteGameMessage } from '../logic/gameMessages'

function Messages({ game }) {
    const { user } = useAuth()
    const { showModal } = useModal()
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState(null)
    const [userCache, setUserCache] = useState({})

    const updateUserCache = async (messages) => {
        const uniqueUserIds = [...new Set(messages.map(msg => msg.userId))]
        const newUserCache = { ...userCache }
        const uncachedUserIds = uniqueUserIds.filter(id => !newUserCache[id])

        const usersData = await Promise.all(
            uncachedUserIds.map(userId => fetchUserData(userId))
        )

        usersData.forEach((userData, index) => {
            if (userData) {
                newUserCache[uncachedUserIds[index]] = {
                    username: userData.username,
                    avatar: userData.avatar
                }
            }
        })

        setUserCache(newUserCache)
        return newUserCache
    }

    const loadMessages = async () => {
        const messagesArray = await fetchGameMessages(game.id)
        const updatedCache = await updateUserCache(messagesArray)

        const updatedMessages = messagesArray.map(msg => ({
            ...msg,
            username: updatedCache[msg.userId]?.username || msg.username || 'User',
            avatar: updatedCache[msg.userId]?.avatar || msg.avatar
        }))

        setMessages(updatedMessages)
    }

    useEffect(() => {
        let isMounted = true

        const initialize = async () => {
            await loadMessages()
        }

        initialize()

        return () => {
            isMounted = false
        }
    }, [game.id])

    if (messages === null) {
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !user) return

        const optimisticMessage = {
            userId: user.id,
            text: newMessage.trim(),
            timestamp: new Date().toISOString(),
            username: user.username,
            avatar: user.avatar
        }

        try {
            setUserCache(prev => ({
                ...prev,
                [user.id]: {
                    username: user.username,
                    avatar: user.avatar
                }
            }))

            setMessages(prev => [...prev, optimisticMessage])
            setNewMessage('')

            await postGameMessage(game.id, {
                userId: user.id,
                text: newMessage.trim()
            })

        } catch (error) {
            console.error('Error saving message:', error)
            setMessages(prev => prev.filter(msg => msg.timestamp !== optimisticMessage.timestamp))
        }
    }

    const handleDeleteMessage = async (timestamp) => {
        if (!user) return

        showModal(
            'Delete Message',
            'Are you sure you want to delete this message?',
            async () => {
                try {
                    const result = await deleteGameMessage(game.id, user.id, timestamp)
                    if (result.success) {
                        await loadMessages()
                    } else {
                        throw new Error(result.message || 'Delete failed')
                    }
                } catch (error) {
                    console.error('Delete error:', error)
                    try {
                        await loadMessages()
                    } catch (fetchError) {
                        console.error('Failed to refresh messages:', fetchError)
                    }
                    showModal(
                        'Error',
                        error.response?.data?.message ||
                        error.message ||
                        'Could not delete message. Please try again.'
                    )
                }
            }
        )
    }

    const renderAvatar = (msg) => {
        const hasAvatar = msg.avatar !== undefined && msg.avatar !== null
        const userInitial = (msg.username || 'U').charAt(0).toUpperCase()

        return hasAvatar ? (
            <img
                src={msg.avatar}
                alt={msg.username || 'User'}
                className="w-8 h-8 rounded-full border-2 border-retro-yellow flex-shrink-0"
                onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                }}
            />
        ) : (
            <div className="w-8 h-8 rounded-full bg-retro-pink flex items-center justify-center border-2 border-retro-yellow flex-shrink-0">
                <span className="text-sm font-bold text-white">{userInitial}</span>
            </div>
        )
    }

    const renderMessage = (msg, index) => {
        const displayUsername = msg.username || 'User'
        const displayAvatar = msg.avatar

        const isCurrentUser = user?.id === msg.userId
        const messageDate = new Date(msg.timestamp)
        const now = new Date()
        const isRecent = (now - messageDate) < 5 * 60 * 1000

        return (
            <div
                key={`${msg.userId}-${msg.timestamp}-${index}`}
                className={`p-4 ${isCurrentUser ? 'bg-retro-green/20' : ''} ${isRecent ? 'animate-pulse' : ''}`}
            >
                <div className="flex items-start space-x-3">
                    {renderAvatar({ ...msg, username: displayUsername, avatar: displayAvatar })}
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="font-retro text-gray-800">
                                    {truncateUsername(displayUsername)}
                                </span>
                                <span
                                    className="text-xs text-gray-500"
                                    title={messageDate.toLocaleString()}
                                >
                                    {formatMessageTime(messageDate)}
                                </span>
                            </div>
                            {isCurrentUser && (
                                <button
                                    onClick={() => handleDeleteMessage(msg.timestamp)}
                                    className="text-gray-500 hover:text-retro-pink transition-colors p-1 rounded-full hover:bg-gray-100"
                                    aria-label="Delete message"
                                    title="Delete message"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-gray-800 mt-1 break-words">{msg.text}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border-2 border-retro-green overflow-hidden w-full">
            <form onSubmit={handleSubmit} className="p-2 sm:p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a message..."
                        className="flex-1 bg-gray-100 border-2 border-retro-yellow text-gray-800 px-3 py-2 rounded sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-retro-yellow"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        className="bg-retro-green hover:bg-retro-green-dark text-white font-retro px-4 py-2 rounded sm:rounded-l-none"
                        disabled={!newMessage.trim()}
                    >
                        Send
                    </button>
                </div>
            </form>

            <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                {messages.length > 0 ? (
                    messages.map(renderMessage)
                ) : (
                    <p className="text-gray-500 font-retro text-center py-4">
                        No messages yet! Be the first to comment!
                    </p>
                )}
            </div>
        </div>
    )
}

export default Messages