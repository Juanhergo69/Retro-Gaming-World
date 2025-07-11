import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

function ProtectedRoute({ children }) {
    const { user, authChecked, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (authChecked && !isAuthenticated()) {
            navigate('/login', {
                state: { from: location },
                replace: true
            })
        }
    }, [authChecked, isAuthenticated, navigate, location])

    return user ? children : null
}

export default ProtectedRoute