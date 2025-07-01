import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4">
            {/* Contenedor para la imagen con efecto hover */}
            <div className="mb-8 transition-transform duration-300 hover:scale-105">
                <img
                    src="/images/Rgw.jpg"
                    alt="Retro Gaming World Logo"
                    className="max-w-xs md:max-w-sm lg:max-w-md rounded-lg shadow-retro"
                />
            </div>

            <h1 className="text-retro-pink font-retro text-5xl md:text-6xl lg:text-7xl mb-8 text-center">
                Retro Gaming World
            </h1>
            <p className="text-retro-yellow font-retro text-xl mb-12 text-center">
                Relive the classics. Challenge your friends.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
                <Button onClick={() => navigate('/register')} variant="primary">
                    Register
                </Button>
                <Button onClick={() => navigate('/login')} variant="secondary">
                    Login
                </Button>
            </div>
        </div>
    )
}

export default LandingPage