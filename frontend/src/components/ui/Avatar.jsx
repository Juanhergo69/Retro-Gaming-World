function Avatar({ src, alt, className = '', fallback = null }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover rounded-full"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-retro-purple text-white font-retro rounded-full">
                    {fallback || alt?.charAt(0)?.toUpperCase()}
                </div>
            )}
        </div>
    )
}

export default Avatar