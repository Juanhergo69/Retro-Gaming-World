const variantClasses = {
    primary: 'bg-retro-purple hover:bg-retro-pink',
    secondary: 'bg-retro-blue hover:bg-retro-green',
    danger: 'bg-retro-pink hover:bg-red-700',
    menu: 'bg-transparent text-retro-dark hover:bg-retro-purple/50',
    'menu-danger': 'bg-transparent text-retro-pink hover:bg-retro-pink/50',
}

function Button({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`px-6 py-3 rounded-lg font-retro transition-colors shadow-retro hover:shadow-retro-lg ${variantClasses[variant]
                } ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button