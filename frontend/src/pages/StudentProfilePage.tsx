import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function StudentProfilePage() {
  const { userProfile, updateUserProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(userProfile?.name ?? '')
    setLinkedinUrl(userProfile?.linkedin_url ?? '')
  }, [userProfile])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      await updateUserProfile({
        name: name.trim(),
        linkedin_url: linkedinUrl.trim() || null,
      })
      setMessage('Profile updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600">Manage your personal details</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <section className="bg-white rounded-lg shadow p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Personal information</h2>
            <p className="text-gray-600 mt-1">Keep your profile details up to date.</p>
          </div>

          {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{message}</div>}
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                type="email"
                value={userProfile?.email ?? ''}
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">Email is managed by your authentication provider.</p>
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                placeholder="https://www.linkedin.com/in/your-name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
