import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, userProfile, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated after OAuth redirect
    if (!loading) {
      if (user && userProfile) {
        // Successfully authenticated, redirect based on role
        const redirectPath = userProfile.role === 'admin' ? '/admin' : '/dashboard'
        navigate(redirectPath, { replace: true })
      } else if (user && !userProfile) {
        // User exists but profile might still be loading
        // Wait a moment then redirect to dashboard
        const timer = setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        // No user authenticated, something went wrong
        setError('Authentication failed. Please try again.')
        const timer = setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [user, userProfile, loading, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0-11l.618-.618a.5.5 0 00-.236-.765A9 9 0 1012 21a9 9 0 008.618-13.618z"
                />
              </svg>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <p className="text-gray-600 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we authenticate your account...</p>
          </>
        )}
      </div>
    </div>
  )
}
