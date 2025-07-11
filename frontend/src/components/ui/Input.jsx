import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const Input = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    required = false,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPassword ? 'text' : type

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className="block text-gray-700 text-sm font-bold mb-2"
                >
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    className={`
                        shadow appearance-none border rounded w-full py-2 px-3 
                        text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                        ${error ? 'border-red-500' : 'border-gray-300'}
                        ${isPasswordField ? 'pr-10' : ''}
                        bg-white
                        text-black
                    `}
                    {...props}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <FaEyeSlash className="text-gray-500" />
                        ) : (
                            <FaEye className="text-gray-500" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
        </div>
    )
}

export default Input