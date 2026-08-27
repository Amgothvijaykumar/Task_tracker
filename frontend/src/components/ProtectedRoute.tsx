import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'student'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const email = (user.email || '').toLowerCase()
  const isAdmin = email === 'amgothvijaykumar43@gmail.com' || email === 'careerwithchaitanya@gmail.com' || email === 'careerwithchaithanya@gmail.com' || email === 'amgoth20@gmail.com' || email.includes('admin')
  const activeProfile = userProfile || {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: isAdmin ? 'admin' : 'student',
  }

  if (requiredRole && activeProfile.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
