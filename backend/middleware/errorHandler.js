import { AppError, ERROR_MESSAGES } from 'common'

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack)

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            errorCode: err.errorCode,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        })
    }

    res.status(500).json({
        success: false,
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.INTERNAL_ERROR
    })
}
