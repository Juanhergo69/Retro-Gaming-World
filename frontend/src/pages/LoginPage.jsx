import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import {
    InvalidEmailError,
    InvalidPasswordError,
    UserNotFoundError,
    UnauthorizedError,
    getErrorMessage
} from 'common'

function LoginPage() {
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const { showModal } = useModal()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setCredentials(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await login(
                { email: credentials.email, password: credentials.password },
                credentials.rememberMe
            )
            navigate('/home')
        } catch (error) {
            console.error('Login error:', error)

            if (error instanceof InvalidEmailError) {
                showModal('Login error', error.message)
                return
            }

            if (error instanceof InvalidPasswordError) {
                showModal('Login error', error.message)
                return
            }

            if (error instanceof UserNotFoundError) {
                showModal('Login error', error.message)
                return
            }

            if (error instanceof UnauthorizedError) {
                showModal('Login error', 'Invalid email or password')
                return
            }

            showModal('Login Error', getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-retro-dark flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-retro max-w-md w-full">
                <h2 className="text-2xl font-retro text-retro-purple mb-6 text-center">
                    Welcome Back
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={credentials.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={credentials.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                    />
                    <Checkbox
                        name="rememberMe"
                        checked={credentials.rememberMe}
                        onChange={handleChange}
                        label="Remember me"
                    />
                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Login'}
                        </Button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="text-retro-blue hover:underline"
                        >
                            Register here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage