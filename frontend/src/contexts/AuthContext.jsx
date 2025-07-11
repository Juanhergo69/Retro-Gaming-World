import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, loginUser, fetchCurrentUser } from '../logic/authAPI'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [authChecked, setAuthChecked] = useState(false)
    const navigate = useNavigate()

    const isAuthenticated = () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        return !!token
    }

    const loadUser = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (!token) {
            setAuthChecked(true)
            return
        }

        try {
            const userData = await fetchCurrentUser()
            setUser(userData)
        } catch (error) {
            console.error('Error loading user:', error)
            if (error.message === 'Unauthorized') {
                localStorage.removeItem('token')
                sessionStorage.removeItem('token')
            }
        } finally {
            setAuthChecked(true)
        }
    }

    useEffect(() => {
        loadUser()
    }, [])

    const register = async (userData) => {
        try {
            const { token, user } = await registerUser(userData)
            localStorage.setItem('token', token)
            setUser(user)
            navigate('/home')
        } catch (error) {
            throw error
        }
    }

    const login = async (credentials, rememberMe) => {
        try {
            const { token, user } = await loginUser(credentials)

            if (rememberMe) {
                localStorage.setItem('token', token)
            } else {
                sessionStorage.setItem('token', token)
            }

            setUser(user)
            navigate('/home')
        } catch (error) {
            throw error
        }
    }

    const logout = (options = {}) => {
        const { redirect = true } = options

        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        setUser(null)

        if (redirect) {
            navigate('/login')
        }
    }

    const updateUser = (updatedUserData) => {
        setUser(prev => ({ ...prev, ...updatedUserData }))
    }

    const value = {
        user,
        authChecked,
        isAuthenticated,
        register,
        login,
        logout,
        updateUser,
        loadUser
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}