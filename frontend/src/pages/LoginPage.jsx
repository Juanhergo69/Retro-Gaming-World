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
                        <Button type="submit" variant="primary" className="w-full">
                            Login
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