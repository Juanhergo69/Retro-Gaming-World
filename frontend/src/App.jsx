import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ModalProvider } from './contexts/ModalContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import NotFoundPage from './pages/NotFoundPage'
import SnakeGame from './pages/SnakeGame'
import TetrisGame from './pages/TetrisGame'
import PacmanGame from './pages/PacmanGame'
import SuperPangGame from './pages/SuperPangGame'
import ConnectFourGame from './pages/ConnectFourGame'
import ArkanoidGame from './pages/ArkanoidGame'
import ProtectedRoute from './components/ProtectedRoute'
import Modal from './components/Modal'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <FavoritesProvider>
            <Modal />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para Snake (gameId = 1) */}
              <Route
                path="/games/1"
                element={
                  <ProtectedRoute>
                    <SnakeGame />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para Tetris (gameId = 2) */}
              <Route
                path="/games/2"
                element={
                  <ProtectedRoute>
                    <TetrisGame />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para Pacman (gameId = 3) */}
              <Route
                path="/games/3"
                element={
                  <ProtectedRoute>
                    <PacmanGame />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para SuperPang (gameId = 4) */}
              <Route
                path="/games/4"
                element={
                  <ProtectedRoute>
                    <SuperPangGame />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para ConnectFour (gameId = 5) */}
              <Route
                path="/games/5"
                element={
                  <ProtectedRoute>
                    <ConnectFourGame />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para Arkanoid (gameId = 6) */}
              <Route
                path="/games/6"
                element={
                  <ProtectedRoute>
                    <ArkanoidGame />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </FavoritesProvider>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App