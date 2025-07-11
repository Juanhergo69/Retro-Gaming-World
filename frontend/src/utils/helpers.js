export const formatScore = (score) => {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const getInitials = (username) => {
    if (!username) return '?'
    const parts = username.split(' ')
    let initials = parts[0].charAt(0).toUpperCase()
    if (parts.length > 1) {
        initials += parts[parts.length - 1].charAt(0).toUpperCase()
    }
    return initials
}

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

export const validatePassword = (password) => {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/
    return re.test(password)
}

export const formatMessageTime = (date) => {
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 8760) return date.toLocaleDateString([], { month: 'short', day: 'numeric' })

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export const truncateUsername = (username) => {
    if (!username) return 'User'
    return username.length > 6 ? `${username.substring(0, 6)}...` : username
}