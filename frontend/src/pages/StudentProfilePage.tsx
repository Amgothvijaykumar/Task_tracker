import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'
import { StudentSummary, fetchStudentFeed, todayIST } from '../lib/studentApi'

export function StudentProfilePage() {
  const { userProfile, updateUserProfile, signOut, getToken } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [summaryData, setSummaryData] = useState<StudentSummary | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    setName(userProfile?.name ?? '')
    setLinkedinUrl(userProfile?.linkedin_url ?? '')
  }, [userProfile])

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        fetchStudentFeed(token, todayIST())
          .then((res) => setSummaryData(res))
          .catch(() => {})
      }
    })
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

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const userName = userProfile?.name || 'Student'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const userScore = summaryData?.total_score ?? 0
  const userRankLabel = summaryData?.rank_label ?? 'Unranked'

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#050506] text-white selection:bg-blue-600 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
    }`}>
      {/* 1. Header / Profile Navbar (Left-Aligned Profile & Theme Switcher) */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark
          ? 'bg-[#09090b]/90 border-zinc-800/80 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05),0_4px_20px_rgba(0,0,0,0.8)]'
          : 'bg-white/90 border-slate-200 shadow-sm'
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
                    ? 'bg-[#121218] hover:bg-zinc-800 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.6)]'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-sm'
                }`}
                title="Click to view profile overview, score, & settings"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-[0_2px_8px_rgba(79,70,229,0.5)] ring-2 ring-blue-500/40">
                  {userInitials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-xs font-black leading-none flex items-center gap-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    <span>{userName}</span>
                    <span className="text-[10px] text-blue-400">▼</span>
                  </p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {userProfile?.email}
                  </p>
                </div>
              </button>

              {/* PROFILE DROPDOWN MENU */}
              {isProfileOpen && (
                <div className={`absolute top-full left-0 mt-3 w-80 sm:w-96 rounded-3xl border p-6 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isDark
                    ? 'bg-gradient-to-b from-[#181820] to-[#0a0a0e] border-zinc-700/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.9)]'
                    : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                }`}>
                  <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-800/80">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-sm font-black text-white shadow-[0_4px_14px_rgba(79,70,229,0.5)]">
                      {userInitials}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-base font-black tracking-tight">{userName}</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{userProfile?.email}</p>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950/90 text-blue-400 border border-blue-800/80 shadow-inner">
                        {userProfile?.role || 'Student'} Aspirant
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Tactile Overview
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-inner'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Score</span>
                          <span>⚡</span>
                        </div>
                        <p className="text-2xl font-black text-blue-400 drop-shadow-sm">{userScore} <span className="text-xs font-normal text-zinc-400">pts</span></p>
                        <p className="text-[10px] text-zinc-500">Earned score</p>
                      </div>

                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-inner'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Rank</span>
                          <span>🏆</span>
                        </div>
                        <p className="text-xs font-black text-purple-400 truncate drop-shadow-sm">{userRankLabel}</p>
                        <p className="text-[10px] text-zinc-500">Global Leaderboard</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleSignOut()
                      }}
                      className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-between transition"
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
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center font-black text-white text-xs shadow-[0_2px_8px_rgba(37,99,235,0.4)]">
                ⚡
              </div>
              <div className="hidden md:block">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  DSA Daily Tracker
                </h1>
                <span className={`text-[10px] font-semibold uppercase tracking-widest block ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Career With Chaitanya Profile
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Navigation, Theme Toggle Switch, Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition ${
                isDark
                  ? 'bg-[#121218] hover:bg-zinc-800 text-zinc-300 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              ← Dashboard
            </button>

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

      {/* Main Profile Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        
        {/* User Identity Header Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 transition ${
          isDark
            ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_4px_16px_rgba(79,70,229,0.5)] ring-4 ring-blue-500/30">
              {userInitials}
            </div>
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {userName}
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{userProfile?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800/80">
                  {userProfile?.role || 'Student'} Aspirant
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-400 border border-purple-800/80">
                  {userRankLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className={`p-3.5 px-5 rounded-2xl border text-center ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Score</p>
              <p className="text-2xl font-black text-amber-400 drop-shadow-sm">{userScore} <span className="text-xs font-normal text-zinc-500">pts</span></p>
            </div>
            <div className={`p-3.5 px-5 rounded-2xl border text-center ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Streak</p>
              <p className="text-2xl font-black text-emerald-400 drop-shadow-sm">{summaryData?.current_streak ?? 0} <span className="text-xs font-normal text-zinc-500">days</span></p>
            </div>
          </div>
        </div>

        {/* Tactile Skeuomorphic Personal Information Form */}
        <section className={`p-6 sm:p-10 rounded-3xl border transition space-y-6 ${
          isDark
            ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div>
            <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
              Personal Information
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Keep your profile details up to date for M Chaitanya & mentor community reviews.
            </p>
          </div>

          {message && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-bold shadow-inner">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-bold shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className={`block text-xs font-black uppercase tracking-wider mb-2 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={saving}
                className={`w-full px-4 py-3 text-xs font-medium rounded-xl border focus:outline-none transition ${
                  isDark
                    ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-blue-500'
                    : 'text-slate-900 bg-white border-slate-300 shadow-inner'
                }`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-xs font-black uppercase tracking-wider mb-2 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={userProfile?.email ?? ''}
                disabled
                className={`w-full px-4 py-3 text-xs font-medium rounded-xl border cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-500 bg-[#08080c]/60 border-zinc-800/60'
                    : 'text-slate-400 bg-slate-100 border-slate-200'
                }`}
              />
              <p className={`text-[11px] mt-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Email is managed securely by your authentication provider.
              </p>
            </div>

            <div>
              <label htmlFor="linkedin" className={`block text-xs font-black uppercase tracking-wider mb-2 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                LinkedIn URL (Optional)
              </label>
              <input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                placeholder="https://www.linkedin.com/in/your-name"
                disabled={saving}
                className={`w-full px-4 py-3 text-xs font-medium rounded-xl border focus:outline-none transition ${
                  isDark
                    ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-blue-500'
                    : 'text-slate-900 bg-white border-slate-300 shadow-inner'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-xs font-black text-white rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(59,130,246,0.4)] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border border-blue-800 active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
