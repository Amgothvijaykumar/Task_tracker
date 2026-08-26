import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
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

export function StudentDashboard() {
  const { userProfile, signOut, getToken } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayIST())
  const [difficulty, setDifficulty] = useState('')
  const [view, setView] = useState<FeedView>('feed')
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

  const loadFeed = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchStudentFeed(token, selectedDate, view, difficulty || undefined)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [token, selectedDate, view, difficulty])

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

  // Compute Overview Stats directly from Backend Ranking Engine
  const totalProblems = data?.problems.length || 0
  const solvedCount = data?.problems.filter((p) => p.my_status === 'completed').length || (data?.daily_goal?.completed ?? 0)
  const unsolvedCount = Math.max(0, totalProblems - solvedCount)

  const userScore = data?.total_score ?? 0
  const userRankLabel = data?.rank_label ?? (solvedCount > 0 ? 'Rank #1 of 1' : 'Unranked')

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#050506] text-white selection:bg-blue-600 selection:text-white' : 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white'
    }`}>
      {/* 1. Header / Profile Navbar */}
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

              {/* PROFILE DROPDOWN MENU / OVERVIEW MODAL */}
              {isProfileOpen && (
                <div className={`absolute top-full left-0 mt-3 w-80 sm:w-96 rounded-3xl border p-6 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isDark
                    ? 'bg-gradient-to-b from-[#181820] to-[#0a0a0e] border-zinc-700/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.9)]'
                    : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                }`}>
                  
                  {/* Profile Dropdown Header */}
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

                  {/* OVERVIEW STATS GRID */}
                  <div>
                    <p className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Tactile Overview
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Solved */}
                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'bg-slate-50 border-slate-200 shadow-inner'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Solved</span>
                          <span>🎯</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-400 drop-shadow-sm">{solvedCount}</p>
                        <p className="text-[10px] text-zinc-500">Problems completed</p>
                      </div>

                      {/* Unsolved */}
                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'bg-slate-50 border-slate-200 shadow-inner'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Unsolved</span>
                          <span>⏳</span>
                        </div>
                        <p className="text-2xl font-black text-amber-400 drop-shadow-sm">{unsolvedCount}</p>
                        <p className="text-[10px] text-zinc-500">Pending tasks</p>
                      </div>

                      {/* Dynamic Score */}
                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'bg-slate-50 border-slate-200 shadow-inner'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                          <span>Score</span>
                          <span>⚡</span>
                        </div>
                        <p className="text-2xl font-black text-blue-400 drop-shadow-sm">{userScore} <span className="text-xs font-normal text-zinc-400">pts</span></p>
                        <p className="text-[10px] text-zinc-500">Earned score</p>
                      </div>

                      {/* Exact Student Rank */}
                      <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isDark
                          ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'bg-slate-50 border-slate-200 shadow-inner'
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

                  {/* Profile Actions */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        navigate('/profile')
                      }}
                      className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-between transition shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${
                        isDark
                          ? 'bg-[#14141c] hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <span>⚙️ Edit Profile & Account Settings</span>
                      <span>→</span>
                    </button>

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
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
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
                  Career With Chaitanya
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Theme Toggle Switch & Sign Out */}
          <div className="flex items-center gap-3">
            {/* Dark/Light Mode Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition active:scale-95 ${
                isDark
                  ? 'bg-[#121218] hover:bg-zinc-800 text-amber-300 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-300 shadow-sm'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              <span>{isDark ? '☀️ Light' : '🌙 Dark'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* 2. Hero Headline Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-medium transition ${
            isDark ? 'bg-[#121218] border-zinc-700/80 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span>Career With Chaitanya · Daily IST Tracker</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
            The Foundation for Your DSA Habit
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            A set of beautifully designed daily challenges that you can solve, track, and share. Start here then build your streak.
          </p>
        </div>

        {/* 3. Top Stats & Score Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Daily Goal Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-3 transition hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`flex items-center justify-between text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              <span>Daily Goal</span>
              <span>🎯</span>
            </div>
            <div className="text-4xl font-black text-blue-400 drop-shadow-sm">
              {goal?.completed ?? 0} <span className={`text-2xl font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>/ {goal?.target ?? 1}</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Complete 1 problem scheduled for today</p>
            
            <div className={`w-full rounded-full h-2.5 overflow-hidden border ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-slate-200 border-slate-300 shadow-inner'
            }`}>
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${goalPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Dynamic Score Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-3 transition hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`flex items-center justify-between text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              <span>Total Score</span>
              <span>⚡</span>
            </div>
            <div className="text-4xl font-black text-amber-400 drop-shadow-sm">
              {userScore} <span className={`text-xl font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>pts</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Earned from timed problem completions</p>
          </div>

          {/* Student Rank Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-3 transition hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`flex items-center justify-between text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              <span>Leaderboard Rank</span>
              <span>🏆</span>
            </div>
            <div className="text-2xl font-black text-purple-400 drop-shadow-sm pt-1">
              {userRankLabel}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Calculated relative to all students</p>
          </div>

          {/* Current Streak Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-3 transition hover:scale-[1.02] ${
            isDark
              ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
              : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`flex items-center justify-between text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              <span>Current Streak</span>
              <span>🔥</span>
            </div>
            <div className="text-4xl font-black text-emerald-400 drop-shadow-sm">
              {data?.current_streak ?? 0} <span className={`text-xl font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>days</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{data?.streak_note || 'Keep your streak alive!'}</p>
          </div>

        </div>

        {/* 4. Scoring Rules Legend Banner */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'bg-blue-950/40 border-blue-800/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-black text-sm">Scoring Rules & Timing Tiers</p>
              <p className="opacity-80">Solve faster after problem post to maximize your rank on the leaderboard!</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/80">Within 1 Day: +10 pts</span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/80">Within 2 Days: +8 pts</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800/80">Within 5 Days: +5 pts</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800">&gt;5 Days: 0 pts</span>
          </div>
        </div>

        {/* 5. Problem Feed Container */}
        <section className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 transition ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200'
        }`}>
          
          {/* Feed Date Controls */}
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b ${
            isDark ? 'border-zinc-800/80' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
                {selectedDate === today ? "Today's Problems" : `Problems for ${formatDate(selectedDate)}`}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Published problems appear here for every student on their scheduled date (IST).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition ${
                  isDark
                    ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-sm'
                }`}
              >
                ← Previous day
              </button>
              <input
                type="date"
                max={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                  isDark
                    ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-blue-500'
                    : 'text-slate-900 bg-white border-slate-300 shadow-inner'
                }`}
                aria-label="Problem date"
              />
              <button
                type="button"
                disabled={selectedDate >= today}
                onClick={() => setSelectedDate(shiftDate(selectedDate, 1) > today ? today : shiftDate(selectedDate, 1))}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-sm'
                }`}
              >
                Next day →
              </button>
            </div>
          </div>

          {/* View Tabs & Difficulty Filter */}
          <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
            isDark ? 'border-zinc-900' : 'border-slate-100'
          }`}>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setView('feed')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition ${
                  view === 'feed'
                    ? isDark
                      ? 'bg-gradient-to-b from-white to-zinc-200 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(255,255,255,0.2)]'
                      : 'bg-blue-600 text-white shadow-md'
                    : isDark ? 'bg-[#121218] text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Default Feed
              </button>

              <button
                type="button"
                onClick={() => setView('skipped')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition ${
                  view === 'skipped'
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(245,158,11,0.3)]'
                    : isDark ? 'bg-[#121218] text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Skipped
              </button>

              <button
                type="button"
                onClick={() => setView('hidden')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 ${
                  view === 'hidden'
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(16,185,129,0.3)]'
                    : isDark ? 'bg-[#121218] text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>👁️</span> Hidden (View again)
              </button>
            </div>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-blue-500'
                  : 'text-slate-900 bg-white border-slate-300 shadow-inner'
              }`}
              aria-label="Filter by difficulty"
            >
              <option value="">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className={`text-center py-16 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Loading problems...
            </div>
          ) : !data || data.problems.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className={`text-base font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {view === 'hidden' ? 'No hidden problems for this date' : view === 'skipped' ? 'No skipped problems' : 'No problems posted yet'}
              </p>
              <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {data?.message || (view === 'hidden' ? 'Problems you hide will appear here so you can view them again.' : 'Check back later or select another published date.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.problems.map((problem) => (
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

        {/* 6. Skeuomorphic Progress History Section */}
        {data && <StudentHistory qualifiedDates={data.qualified_dates} history={data.history} />}

      </main>

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
