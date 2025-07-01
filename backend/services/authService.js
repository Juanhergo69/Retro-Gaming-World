import bcrypt from 'bcrypt'
import * as userRepository from '../data/userRepository.js'
import {
    ValidationError,
    InvalidEmailError,
    InvalidPasswordError,
    PasswordsDontMatchError,
    RequiredFieldsError,
    EmailInUseError,
    UsernameTakenError,
    UnauthorizedError
} from 'common'
import { validateEmail, validatePassword } from '../utils/helpers.js'

const SALT_ROUNDS = 10

export const comparePasswords = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}

export const register = async (userData) => {
    const { username, email, password, confirmPassword } = userData

    if (!username || !email || !password || !confirmPassword) {
        throw new RequiredFieldsError('All fields are required')
    }

    if (password !== confirmPassword) {
        throw new PasswordsDontMatchError()
    }

    try {
        validateEmail(email)
    } catch (error) {
        throw new InvalidEmailError()
    }

    try {
        validatePassword(password)
    } catch (error) {
        throw new InvalidPasswordError()
    }

    const existingUserByEmail = await userRepository.findUserByEmail(email)
    if (existingUserByEmail) {
        throw new EmailInUseError()
    }

    const existingUserByUsername = await userRepository.findUserByUsername(username)
    if (existingUserByUsername) {
        throw new UsernameTakenError()
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    return await userRepository.createUser({
        username,
        email,
        password: hashedPassword
    })
}

export const login = async (email, password) => {
    if (!email || !password) {
        throw new ValidationError('Email and password are required')
    }

    const user = await userRepository.findUserByEmail(email)
    if (!user) {
        throw new UnauthorizedError('Account not found')
    }

    const isPasswordValid = await comparePasswords(password, user.password)
    if (!isPasswordValid) {
        throw new UnauthorizedError('Incorrect password')
    }

    const userObj = user.toObject()
    userObj.id = user._id.toString()
    delete userObj._id
    delete userObj.password

    return user
}

