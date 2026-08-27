import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import { apiUrl } from '../lib/api'

export interface ProfileUpdates {
  name: string
  linkedin_url?: string | null
  github_url?: string | null
  twitter_url?: string | null
  instagram_handle?: string | null
}

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  updateUserProfile: (updates: ProfileUpdates) => Promise<void>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const createFallbackProfile = (u: User) => {
    const email = (u.email || '').toLowerCase()
    const isAdmin = email === 'amgothvijaykumar43@gmail.com' || email === 'careerwithchaitanya@gmail.com' || email === 'careerwithchaithanya@gmail.com' || email === 'amgoth20@gmail.com' || email.includes('admin')
    const fallback = {
      id: u.id,
      email: u.email || '',
      name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
      role: isAdmin ? 'admin' : 'student',
    }
    setUserProfile(fallback)
    return fallback
  }

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Error checking session:', error)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user, session.access_token)
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(true)
        await fetchUserProfile(session.user, session.access_token)
        setLoading(false)
      } else {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (u: User, token: string) => {
    try {
      const response = await fetch(apiUrl('/auth/me/'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        return profile
      }

      if (response.status === 404 || response.status === 401 || response.status === 403) {
        return await registerUser(u, token)
      }

      return createFallbackProfile(u)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return createFallbackProfile(u)
    }
  }

  const registerUser = async (u: User, token: string) => {
    try {
      const response = await fetch(apiUrl('/auth/register/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          role: 'student',
        }),
      })

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        return profile
      }

      return createFallbackProfile(u)
    } catch (error) {
      console.error('Error registering user:', error)
      return createFallbackProfile(u)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      setUser(data.user)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await registerUser(data.user, session.access_token)
      } else {
        createFallbackProfile(data.user)
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user && data.session) {
      setUser(data.user)
      await fetchUserProfile(data.user, data.session.access_token)
    }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
  }

  const updateUserProfile = async (updates: ProfileUpdates) => {
    const token = await getToken()
    if (!token) throw new Error('You must be signed in to update your profile.')

    const response = await fetch(apiUrl('/auth/profile/'), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.error || 'Unable to update profile.')
    }

    setUserProfile(await response.json())
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setUserProfile(null)
  }

  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting token:', error)
      return null
    }
    return data.session?.access_token || null
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    updateUserProfile,
    signOut,
    getToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
