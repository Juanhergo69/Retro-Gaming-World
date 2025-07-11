import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import {
    InvalidEmailError,
    InvalidPasswordError,
    PasswordsDontMatchError,
    EmailInUseError,
    UsernameTakenError,
    RequiredFieldsError,
    getErrorMessage
} from 'common'

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const { showModal } = useModal()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await register(formData)
            navigate('/home')
        } catch (error) {
            console.error('Registration error:', error)

            if (error instanceof RequiredFieldsError) {
                showModal('Registration error', error.message)
                return
            }

            if (error instanceof InvalidEmailError) {
                showModal('Registration error', error.message)
                return
            }

            if (error instanceof InvalidPasswordError) {
                showModal('Registration error', error.message)
                return
            }

            if (error instanceof PasswordsDontMatchError) {
                showModal('Registration error', error.message)
                return
            }

            if (error instanceof EmailInUseError) {
                showModal('Registration error', error.message)
                return
            }

            if (error instanceof UsernameTakenError) {
                showModal('Registration error', error.message)
                return
            }

            showModal('Registration Error', getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-retro-dark flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-retro max-w-md w-full">
                <h2 className="text-2xl font-retro text-retro-purple mb-6 text-center">
                    Create Your Account
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        error={errors.username}
                        required
                    />
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        required
                    />
                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Register'}
                        </Button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-retro-blue hover:underline"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage