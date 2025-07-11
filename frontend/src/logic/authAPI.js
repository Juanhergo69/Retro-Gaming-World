import api from '../api/axiosConfig'
import {
    InvalidEmailError,
    InvalidPasswordError,
    PasswordsDontMatchError,
    RequiredFieldsError,
    EmailInUseError,
    UsernameTakenError,
    UserNotFoundError,
    UnauthorizedError,
    InvalidTokenError
} from 'common'

export const registerUser = async (userData) => {
    try {
        const response = await api.post('/register', userData)
        return response.data
    } catch (error) {
        if (error.response) {
            switch (error.response.data.errorCode) {
                case 'REQUIRED_FIELDS':
                    throw new RequiredFieldsError()
                case 'INVALID_EMAIL':
                    throw new InvalidEmailError()
                case 'INVALID_PASSWORD':
                    throw new InvalidPasswordError()
                case 'PASSWORDS_DONT_MATCH':
                    throw new PasswordsDontMatchError()
                case 'EMAIL_IN_USE':
                    throw new EmailInUseError()
                case 'USERNAME_TAKEN':
                    throw new UsernameTakenError()
                default:
                    throw error
            }
        }
        throw error
    }
}

export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/login', credentials)
        return response.data
    } catch (error) {
        if (error.response) {
            switch (error.response.data.errorCode) {
                case 'INVALID_EMAIL':
                    throw new InvalidEmailError()
                case 'INVALID_PASSWORD':
                    throw new InvalidPasswordError()
                case 'USER_NOT_FOUND':
                    throw new UserNotFoundError()
                case 'UNAUTHORIZED':
                    throw new UnauthorizedError('Invalid email or password')
                case 'INVALID_TOKEN':
                    throw new InvalidTokenError()
                default:
                    throw error
            }
        }
        throw error
    }
}

export const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/me')
        return response.data
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error(getErrorMessage({ errorCode: 'UNAUTHORIZED' }))
        }
        throw new Error(getErrorMessage(error))
    }
}