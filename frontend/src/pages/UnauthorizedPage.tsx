import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="text-center">
        <svg className="mx-auto h-16 w-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2h2m-2 0h-2m8-4a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 text-lg mb-8">You don't have permission to access this page.</p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
