import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'
import {
  FeedView,
  StatusAction,
  StudentFeedResponse,
  StudentProblem,
  fetchStudentFeed,
  shiftDate,
  todayIST,
  updateProblemStatus,
} from '../lib/studentApi'
import { formatDate } from '../lib/adminApi'
import { ProblemCard } from '../components/student/ProblemCard'
import { ShareModal } from '../components/student/ShareModal'
import { StudentHistory } from '../components/student/StudentHistory'

type SidebarCategory = 'all' | 'published' | 'ongoing' | 'skipped' | 'hidden'

export function StudentDashboard() {
  const { userProfile, signOut, getToken } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const [token, setToken] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayIST())
  const [difficulty, setDifficulty] = useState('')
  const [activeCategory, setActiveCategory] = useState<SidebarCategory>('all')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [data, setData] = useState<StudentFeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [shareProblem, setShareProblem] = useState<StudentProblem | null>(null)
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getToken().then(setToken)
  }, [getToken])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Map sidebar category to feed view API query
  const apiView: FeedView = activeCategory === 'hidden' ? 'hidden' : activeCategory === 'skipped' ? 'skipped' : 'feed'

  const loadFeed = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchStudentFeed(token, selectedDate, apiView, difficulty || undefined)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [token, selectedDate, apiView, difficulty])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const handleAction = async (problem: StudentProblem, action: StatusAction) => {
    if (!token) return
    setBusyId(problem.id)
    setError(null)
    try {
      const result = await updateProblemStatus(token, problem.id, action)
      await loadFeed()
      if (action === 'complete' && result.share_draft) {
        setShareProblem({ ...result, share_draft: result.share_draft })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setBusyId(null)
    }
  }

  const today = todayIST()
  const goal = data?.daily_goal
  const goalPercent = goal?.qualified ? 100 : Math.min(100, ((goal?.completed ?? 0) / (goal?.target ?? 1)) * 100)

  // Get user initials for avatar
  const userName = userProfile?.name || 'Student'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Filter problems according to selected category
  const allProblems = data?.problems || []
  const filteredProblems = allProblems.filter((p) => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'published') return p.my_status === 'unassigned' || p.my_status === 'assigned' || p.my_status === 'started'
    if (activeCategory === 'ongoing') return p.my_status === 'started' || p.my_status === 'assigned'
    if (activeCategory === 'skipped') return p.my_status === 'skipped'
    if (activeCategory === 'hidden') return p.my_status === 'hidden'
    return true
  })

  // Exact Status Breakdown Analytics Counts
  const publishedCount = allProblems.length
  const completedCount = allProblems.filter((p) => p.my_status === 'completed').length
  const inProgressCount = allProblems.filter((p) => p.my_status === 'started' || p.my_status === 'assigned').length
  const skippedCount = allProblems.filter((p) => p.my_status === 'skipped').length
  const hiddenCount = allProblems.filter((p) => p.my_status === 'hidden').length

  const userScore = data?.total_score ?? 0
  const userRankLabel = data?.rank_label ?? (completedCount > 0 ? 'Rank #1 of 1' : 'Unranked')

  const isDark = theme === 'dark'

  // Streamlined Navigation Menu Items (Removed My Tasks, Uncompleted, Completed)
  const navItems: { id: SidebarCategory; label: string; icon: string; count?: number }[] = [
    { id: 'all', label: 'Dashboard', icon: '🎛️', count: allProblems.length },
    { id: 'published', label: 'Published Problems', icon: '📝', count: publishedCount },
    { id: 'ongoing', label: 'In Progress / Ongoing', icon: '⚡', count: inProgressCount },
    { id: 'skipped', label: 'Skipped Problems', icon: '⏩', count: skippedCount },
    { id: 'hidden', label: 'Hidden (View again)', icon: '👁️', count: hiddenCount },
  ]

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex ${
      isDark ? 'bg-[#050506] text-white selection:bg-blue-600 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
    }`}>

      {/* 1. LEFT SIDEBAR NAVBAR */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 z-50 flex flex-col justify-between border-r transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        isDark
          ? 'bg-[#09090d]/95 border-zinc-800/80 backdrop-blur-xl shadow-[5px_0_30px_rgba(0,0,0,0.8)]'
          : 'bg-white/95 border-slate-200 backdrop-blur-xl shadow-lg'
      }`}>
        <div>
          {/* Sidebar Top Logo */}
          <div className={`h-16 px-6 flex items-center gap-3 border-b cursor-pointer ${
            isDark ? 'border-zinc-800/80' : 'border-slate-200'
          }`} onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
              ⚡
            </div>
            <div>
              <h1 className={`text-base font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Task Monitor
              </h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest block mt-0.5 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Career With Chaitanya
              </span>
            </div>
          </div>

          {/* Streamlined Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            <p className={`text-[11px] font-black uppercase tracking-wider px-3 mb-2 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`}>
              Navigation Menu
            </p>

            {navItems.map((item) => {
              const isActive = activeCategory === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(item.id)
                    setIsMobileSidebarOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition active:scale-95 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]'
                        : 'bg-blue-600 text-white shadow-md'
                      : isDark
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                          ? 'bg-zinc-800 text-zinc-300'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}

            <div className={`pt-3 mt-3 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false)
                  navigate('/profile')
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">👤</span>
                <span>Profile</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Pill */}
        <div className={`p-4 border-t relative ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`} ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-2xl border transition ${
              isDark
                ? 'bg-[#121218] hover:bg-zinc-800 border-zinc-700/80 shadow-inner'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-md">
                {userInitials}
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold leading-none truncate max-w-[110px] ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {userName}
                </p>
                <p className={`text-[10px] truncate max-w-[110px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {userProfile?.email}
                </p>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-bold">▼</span>
          </button>

          {/* Profile Dropdown Modal */}
          {isProfileOpen && (
            <div className={`absolute bottom-full left-4 right-4 mb-2 rounded-3xl border p-5 shadow-2xl z-50 space-y-3 ${
              isDark
                ? 'bg-gradient-to-b from-[#181820] to-[#0a0a0e] border-zinc-700/80 text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
            }`}>
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-black text-white">
                  {userInitials}
                </div>
                <div>
                  <h4 className="text-xs font-black">{userName}</h4>
                  <p className="text-[10px] text-zinc-400">{userProfile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] text-zinc-400 font-bold">Score</p>
                  <p className="text-base font-black text-amber-400">{userScore} pts</p>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] text-zinc-400 font-bold">Rank</p>
                  <p className="text-xs font-black text-purple-400 truncate">{userRankLabel}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false)
                  navigate('/profile')
                }}
                className={`w-full py-2 text-xs font-bold rounded-xl border text-center ${
                  isDark ? 'bg-[#14141c] text-zinc-200 border-zinc-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                ⚙️ Account Settings
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false)
                  handleSignOut()
                }}
                className="w-full py-2 text-xs font-bold rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800 text-center"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop for Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* MAIN LAYOUT WRAPPER (Padded left for sidebar) */}
      <div className="flex-1 min-w-0 md:ml-64 flex flex-col">

        {/* 2. TOP HEADER NAVBAR */}
        <header className={`sticky top-0 z-30 h-16 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-8 transition-colors ${
          isDark
            ? 'bg-[#09090b]/90 border-zinc-800/80 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]'
            : 'bg-white/90 border-slate-200 shadow-sm'
        }`}>
          {/* Left: Mobile Hamburger & Welcome Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`p-2 rounded-xl border md:hidden ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
              aria-label="Toggle mobile menu"
            >
              ☰
            </button>

            <div>
              <h2 className={`text-base font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>Welcome back, {userName}! 👋</span>
              </h2>
              <p className={`text-[11px] hidden sm:block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Track your DSA problem-solving performance.
              </p>
            </div>
          </div>

          {/* Right: Actions, Notification Bell, Theme Switcher, Sign Out */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`p-2 rounded-2xl border transition ${
                isDark ? 'bg-[#121218] hover:bg-zinc-800 border-zinc-700/80 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="Notifications"
            >
              🔔
            </button>

            <ThemeToggle />

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded-xl transition shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* DASHBOARD ANALYTICS & PROBLEM STATUS BREAKDOWN SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Student Problem Performance Analytics
                </h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Overview of your published, completed, in-progress, skipped, and hidden problem statistics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* 1. Published Problems */}
              <div className={`p-5 rounded-3xl border shadow-xl space-y-2 transition hover:scale-[1.02] ${
                isDark
                  ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base">
                  📝
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Published Problems</p>
                <p className="text-3xl font-black text-blue-400">{publishedCount}</p>
              </div>

              {/* 2. In Progress / Ongoing */}
              <div className={`p-5 rounded-3xl border shadow-xl space-y-2 transition hover:scale-[1.02] ${
                isDark
                  ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-base">
                  ⚡
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>In Progress</p>
                <p className="text-3xl font-black text-purple-400">{inProgressCount}</p>
              </div>

              {/* 3. Completed */}
              <div className={`p-5 rounded-3xl border shadow-xl space-y-2 transition hover:scale-[1.02] ${
                isDark
                  ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base">
                  ✅
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Completed</p>
                <p className="text-3xl font-black text-emerald-400">{completedCount}</p>
              </div>

              {/* 4. Skipped */}
              <div className={`p-5 rounded-3xl border shadow-xl space-y-2 transition hover:scale-[1.02] ${
                isDark
                  ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base">
                  ⏩
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Skipped</p>
                <p className="text-3xl font-black text-amber-400">{skippedCount}</p>
              </div>

              {/* 5. Hidden */}
              <div className={`p-5 rounded-3xl border shadow-xl space-y-2 transition hover:scale-[1.02] ${
                isDark
                  ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-400 text-base">
                  👁️
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Hidden</p>
                <p className="text-3xl font-black text-zinc-400">{hiddenCount}</p>
              </div>

            </div>
          </div>

          {/* Leaderboard Score & Timing Banner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Score & Rank Highlight Card */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-xl space-y-4 ${
              isDark
                ? 'bg-gradient-to-br from-blue-950/40 via-zinc-900/60 to-purple-950/40 border-blue-500/30'
                : 'bg-blue-50/80 border-blue-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Leaderboard Performance</span>
                <span className="text-xl">🏆</span>
              </div>

              <div className="space-y-1">
                <p className="text-3xl font-black text-amber-400 drop-shadow-sm">{userScore} <span className="text-sm font-normal text-zinc-400">pts</span></p>
                <p className="text-xs font-black text-purple-400">{userRankLabel}</p>
              </div>

              <div className="pt-2 border-t border-blue-500/20 flex justify-between text-xs font-bold text-zinc-300">
                <span>Current Streak:</span>
                <span className="text-emerald-400">{data?.current_streak ?? 0} days 🔥</span>
              </div>
            </div>

            {/* Daily Goal Meter */}
            <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xl space-y-4 ${
              isDark
                ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Daily Goal ({goal?.completed ?? 0} / {goal?.target ?? 1})
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Complete 1 problem scheduled for today to maintain your streak.</p>
                </div>
                <span className="text-2xl">🎯</span>
              </div>

              <div className={`w-full rounded-full h-3 overflow-hidden border ${
                isDark ? 'bg-[#08080c] border-zinc-800 shadow-inner' : 'bg-slate-200 border-slate-300 shadow-inner'
              }`}>
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/80">Within 1 Day: +10 pts</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/80">Within 2 Days: +8 pts</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800/80">Within 5 Days: +5 pts</span>
              </div>
            </div>

          </div>

          {/* Problem Feed Container */}
          <section className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 transition ${
            isDark
              ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white border-slate-200'
          }`}>
            
            {/* Feed Date & Difficulty Controls */}
            <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-zinc-800/80' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
                  {selectedDate === today ? "Today's Problems" : `Problems for ${formatDate(selectedDate)}`}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Showing {filteredProblems.length} problem(s) for selected view.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                      isDark
                        ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80'
                        : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                    }`}
                  >
                    ← Prev
                  </button>
                  <input
                    type="date"
                    max={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border focus:outline-none transition ${
                      isDark
                        ? 'text-white bg-[#08080c] border-zinc-700/80 focus:border-blue-500'
                        : 'text-slate-900 bg-white border-slate-300'
                    }`}
                    aria-label="Problem date"
                  />
                  <button
                    type="button"
                    disabled={selectedDate >= today}
                    onClick={() => setSelectedDate(shiftDate(selectedDate, 1) > today ? today : shiftDate(selectedDate, 1))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80'
                        : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                    }`}
                  >
                    Next →
                  </button>
                </div>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border focus:outline-none transition ${
                    isDark
                      ? 'text-white bg-[#08080c] border-zinc-700/80 focus:border-blue-500'
                      : 'text-slate-900 bg-white border-slate-300'
                  }`}
                  aria-label="Filter by difficulty"
                >
                  <option value="">All difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            {loading ? (
              <div className={`text-center py-16 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Loading problems...
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className={`text-base font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  No problems found in this category for {formatDate(selectedDate)}
                </p>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Select another category from the left sidebar or pick another scheduled date.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    busy={busyId === problem.id}
                    onAction={handleAction}
                    onShare={setShareProblem}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Skeuomorphic Progress History Section */}
          {data && <StudentHistory qualifiedDates={data.qualified_dates} history={data.history} />}

        </main>
      </div>

      {/* LinkedIn Share Modal */}
      {shareProblem && token && (
        <ShareModal
          token={token}
          problem={shareProblem}
          draft={shareProblem.share_draft || ''}
          onClose={() => setShareProblem(null)}
        />
      )}
    </div>
  )
}
