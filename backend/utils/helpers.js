export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) {
        throw new Error('Please enter a valid email address')
    }
}

export const validatePassword = (password) => {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/
    if (!re.test(password)) {
        throw new Error('Password must contain at least one capital letter, one number, and one special character, and be 8 characters long.')
    }
}
