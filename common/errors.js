export class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode || 500
        this.errorCode = errorCode || 'INTERNAL_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
    }
}

export class InvalidTokenError extends AppError {
    constructor(message = 'Invalid or expired token') {
        super(message, 401, 'INVALID_TOKEN')
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
    }
}

// Errores de validación
export class ValidationError extends AppError {
    constructor(message = 'Validation error', errors = {}) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors
    }
}

export class InvalidEmailError extends ValidationError {
    constructor(message = 'Please enter a valid email address') {
        super(message);
        this.errorCode = 'INVALID_EMAIL'
    }
}

export class InvalidPasswordError extends ValidationError {
    constructor(message = 'Password must contain at least one capital letter, one number, and one special character, and be 8 characters long.') {
        super(message);
        this.errorCode = 'INVALID_PASSWORD'
    }
}

export class PasswordsDontMatchError extends ValidationError {
    constructor(message = 'Passwords do not match') {
        super(message);
        this.errorCode = 'PASSWORDS_DONT_MATCH'
    }
}

export class RequiredFieldsError extends ValidationError {
    constructor(message = 'All fields are required') {
        super(message);
        this.errorCode = 'REQUIRED_FIELDS';
    }
}

// Errores de recursos
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND')
    }
}

export class UserNotFoundError extends NotFoundError {
    constructor(message = 'User not found') {
        super(message);
        this.errorCode = 'USER_NOT_FOUND'
    }
}

export class GameNotFoundError extends NotFoundError {
    constructor(message = 'Game not found') {
        super(message);
        this.errorCode = 'GAME_NOT_FOUND'
    }
}

export class MessageNotFoundError extends NotFoundError {
    constructor(message = 'Message not found') {
        super(message);
        this.errorCode = 'MESSAGE_NOT_FOUND'
    }
}

// Errores de conflicto
export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409, 'CONFLICT')
    }
}

export class EmailInUseError extends ConflictError {
    constructor(message = 'Email already in use') {
        super(message);
        this.errorCode = 'EMAIL_IN_USE'
    }
}

export class UsernameTakenError extends ConflictError {
    constructor(message = 'Username already taken') {
        super(message)
        this.errorCode = 'USERNAME_TAKEN'
    }
}

export const ERROR_MESSAGES = {

    UNAUTHORIZED: 'You need to be logged in to perform this action',
    INVALID_TOKEN: 'Your session has expired. Please log in again.',
    FORBIDDEN: 'You are not authorized to perform this action',

    VALIDATION_ERROR: 'There was a problem with your input',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PASSWORD: 'Password must contain: 8+ chars, 1 uppercase, 1 number, 1 special char',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    REQUIRED_FIELDS: 'All fields are required',

    NOT_FOUND: 'The requested resource was not found',
    USER_NOT_FOUND: 'User not found',
    GAME_NOT_FOUND: 'Game not found',
    MESSAGE_NOT_FOUND: 'Message not found or not authorized',

    CONFLICT: 'A conflict occurred with your request',
    EMAIL_IN_USE: 'This email is already registered',
    USERNAME_TAKEN: 'This username is already taken',

    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.'
}

export const getErrorMessage = (error) => {
    if (error instanceof AppError) {
        return ERROR_MESSAGES[error.errorCode] || error.message
    }
    return ERROR_MESSAGES.INTERNAL_ERROR
}