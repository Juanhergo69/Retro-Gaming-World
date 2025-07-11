import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4">
            {/* Contenedor para la imagen */}
            <div className="mb-4 sm:mb-8 transition-transform duration-300 hover:scale-105">
                <img
                    src="/images/Rgw.jpg"
                    alt="Retro Gaming World Logo"
                    className="w-48 sm:w-64 md:max-w-sm lg:max-w-md rounded-lg shadow-retro"
                />
            </div>

            <h1 className="text-retro-pink font-retro text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-8 text-center">
                Retro Gaming World
            </h1>
            <p className="text-retro-yellow font-retro text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-center">
                Relive the classics. Challenge your friends.
            </p>

            {/* Contenedor de botones - SOLUCIÓN DEFINITIVA */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                    onClick={() => navigate('/register')}
                    variant="primary"
                    className="w-full max-w-xs sm:w-40 flex justify-center"
                >
                    <span className="text-center">Register</span>
                </Button>
                <Button
                    onClick={() => navigate('/login')}
                    variant="secondary"
                    className="w-full max-w-xs sm:w-40 flex justify-center"
                >
                    <span className="text-center">Login</span>
                </Button>
            </div>
        </div>
    )
}

export default LandingPage