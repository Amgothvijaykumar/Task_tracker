import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { StudentDashboard } from './pages/StudentDashboard'
import { StudentProfilePage } from './pages/StudentProfilePage'
import { AdminPanel } from './pages/AdminPanel'
import { UnauthorizedPage } from './pages/UnauthorizedPage'

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}
