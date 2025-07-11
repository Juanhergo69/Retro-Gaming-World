import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'

function NotFoundPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4">
            <h1 className="text-retro-pink font-retro text-5xl md:text-6xl lg:text-7xl mb-4">
                404
            </h1>
            <p className="text-retro-yellow font-retro text-xl mb-8 text-center">
                Oops! The page you're looking for doesn't exist.
            </p>
            <div className="flex gap-4">
                {isAuthenticated() ? (
                    <Button onClick={() => navigate('/home')} variant="primary">
                        Go to Home
                    </Button>
                ) : (
                    <Button onClick={() => navigate('/')} variant="primary">
                        Go to Landing
                    </Button>
                )}
            </div>
        </div>
    )
}

export default NotFoundPage