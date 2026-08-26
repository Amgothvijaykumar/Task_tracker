import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { AdminAnalytics, fetchAdminAnalytics, formatDate, todayIST } from '../lib/adminApi'
import { AdminOverview } from '../components/admin/AdminOverview'
import { AdminProblems } from '../components/admin/AdminProblems'
import { AdminStudents } from '../components/admin/AdminStudents'
import { ThemeToggle } from '../components/ThemeToggle'

type Tab = 'overview' | 'problems' | 'students'

export function AdminPanel() {
  const { userProfile, signOut, getToken } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedDate, setSelectedDate] = useState(todayIST())
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getToken().then(setToken)
  }, [getToken])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAnalytics = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAnalytics(token, selectedDate)
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [token, selectedDate])

  useEffect(() => {
    if (activeTab === 'overview' && token) {
      loadAnalytics()
    }
  }, [activeTab, token, loadAnalytics])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'problems', label: 'Manage Problems', icon: '📝' },
    { id: 'students', label: 'Students Analytics', icon: '👥' },
  ]

  const userName = userProfile?.name || 'Admin User'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#050506] text-white selection:bg-blue-600 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
    }`}>
      {/* 1. Header / Profile Navbar (Left-Aligned Profile & Theme Switcher) */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark ? 'bg-[#09090b]/90 border-zinc-800/80' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 relative">
          
          {/* LEFT SIDE: Interactive Profile Circle & Brand Navbar */}
          <div className="flex items-center gap-4">
            
            {/* Interactive Profile Circle Avatar Pill */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border transition cursor-pointer hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
                title="Click to view admin profile & stats"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-md ring-2 ring-rose-500/30">
                  {userInitials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-xs font-bold leading-none flex items-center gap-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    <span>{userName}</span>
                    <span className="text-[10px]">▼</span>
                  </p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {userProfile?.email}
                  </p>
                </div>
              </button>

              {/* PROFILE DROPDOWN MENU / OVERVIEW MODAL */}
              {isProfileOpen && (
                <div className={`absolute top-full left-0 mt-3 w-80 sm:w-96 rounded-2xl border p-5 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isDark ? 'bg-zinc-950/95 border-zinc-800 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                }`}>
                  
                  {/* Profile Dropdown Header */}
                  <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-800/60">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg">
                      {userInitials}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-base font-extrabold tracking-tight">{userName}</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{userProfile?.email}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-400 border border-rose-800/60">
                        Admin Controller
                      </span>
                    </div>
                  </div>

                  {/* OVERVIEW STATS GRID (Admin Level) */}
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Admin Overview
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-3 rounded-xl border space-y-1 ${
                        isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Date</span>
                          <span>📅</span>
                        </div>
                        <p className="text-xs font-bold text-blue-400">{formatDate(selectedDate)}</p>
                        <p className="text-[10px] text-zinc-500">Scheduled Date</p>
                      </div>

                      <div className={`p-3 rounded-xl border space-y-1 ${
                        isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Role</span>
                          <span>🔐</span>
                        </div>
                        <p className="text-xs font-bold text-rose-400">System Admin</p>
                        <p className="text-[10px] text-zinc-500">Full Access</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleSignOut()
                      }}
                      className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 flex items-center justify-between transition"
                    >
                      <span>🚪 Sign Out</span>
                      <span>↗</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Separator Divider */}
            <div className={`h-6 w-px hidden sm:block ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-md">
                🛡️
              </div>
              <div className="hidden md:block">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  DSA Admin Panel
                </h1>
                <span className={`text-[10px] font-semibold uppercase tracking-widest block ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  Career With Chaitanya Control
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Skeuomorphic Theme Toggle Switch with Burnout & Sign Out */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Admin Tab Navigation Bar */}
      <div className={`border-b transition-colors ${
        isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 sm:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? isDark
                      ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                      : 'border-rose-600 text-rose-600 bg-rose-50'
                    : isDark
                      ? 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <AdminOverview
            data={analytics}
            loading={loading}
            error={error}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {activeTab === 'problems' && token && (
          <AdminProblems token={token} />
        )}

        {activeTab === 'students' && token && (
          <AdminStudents token={token} selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
      </main>
    </div>
  )
}
