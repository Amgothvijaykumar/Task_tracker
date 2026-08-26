import { useCallback, useEffect, useState } from 'react'
import { StudentActivity, fetchAdminStudents, formatDate } from '../../lib/adminApi'
import { useTheme } from '../../contexts/ThemeContext'

interface AdminStudentsProps {
  token: string
  selectedDate: string
  onDateChange: (date: string) => void
}

export function AdminStudents({ token, selectedDate, onDateChange }: AdminStudentsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [students, setStudents] = useState<StudentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminStudents(token, selectedDate, search || undefined)
      setStudents(data.students)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [token, selectedDate, search])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
            Student Activity & Analytics
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Activity for {formatDate(selectedDate)} (IST)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="students-date" className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
            Date:
          </label>
          <input
            id="students-date"
            type="date"
            className={`px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
              isDark
                ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
                : 'text-slate-900 bg-white border-slate-300 shadow-inner'
            }`}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={`flex-1 max-w-sm px-3.5 py-2.5 text-xs font-medium rounded-xl border focus:outline-none transition ${
            isDark
              ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
              : 'text-slate-900 bg-white border-slate-300 shadow-inner'
          }`}
        />
        <button
          type="submit"
          className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 ${
            isDark
              ? 'bg-[#181822] hover:bg-zinc-800 text-white border-zinc-700/80'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
          }`}
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput('') }}
            className={`px-4 py-2.5 text-xs font-medium rounded-xl border transition ${
              isDark
                ? 'bg-[#121218] hover:bg-zinc-800 text-zinc-400 border-zinc-700/80'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
            }`}
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-16 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className={`p-8 rounded-3xl border text-center ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-xl'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>No students found</p>
        </div>
      ) : (
        <div className={`p-6 rounded-3xl border overflow-x-auto transition ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b text-left ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
              }`}>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Student</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Completions</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Current Streak</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Longest Streak</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Last Completion</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Student Profile</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-slate-100'}`}>
              {students.map((s) => (
                <tr key={s.id} className={`transition ${isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-slate-50'}`}>
                  <td className="py-4 pr-4">
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.name}</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{s.email}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`font-black ${s.today_completions > 0 ? 'text-emerald-400 font-bold' : isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                      {s.today_completions}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-bold text-blue-400">{s.current_streak} days</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-bold text-purple-400">{s.longest_streak} days</span>
                  </td>
                  <td className={`py-4 pr-4 text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    {s.last_completion
                      ? new Date(s.last_completion).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className="px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(59,130,246,0.3)] transition active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <span>👤 View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STUDENT PROFILE & ANALYTICS MODAL */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          isDark={isDark}
        />
      )}
    </div>
  )
}

function StudentProfileModal({
  student,
  onClose,
  isDark,
}: {
  student: StudentActivity
  onClose: () => void
  isDark: boolean
}) {
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-2xl rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 my-8 transition animate-in fade-in zoom-in-95 duration-200 ${
        isDark
          ? 'bg-gradient-to-b from-[#181822] via-[#101018] to-[#0a0a0e] border-zinc-700/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_25px_60px_rgba(0,0,0,0.9)]'
          : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-6 right-6 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition ${
            isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
          }`}
        >
          ✕
        </button>

        {/* Student Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-800/80 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-xl font-black text-white shadow-[0_4px_16px_rgba(79,70,229,0.5)] ring-4 ring-blue-500/30">
            {initials}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">{student.name}</h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{student.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800/80">
                {student.role || 'Student'} Aspirant
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                student.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                ● {student.status}
              </span>
              {student.rank_label && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-400 border border-purple-800/80">
                  {student.rank_label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Social Media Handles Section */}
        <div className="space-y-3">
          <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Social Media & Profiles
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LinkedIn */}
            {student.linkedin_url ? (
              <a
                href={student.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl border flex items-center justify-between transition hover:scale-[1.02] bg-blue-950/40 hover:bg-blue-900/60 border-blue-800/60 text-blue-300 text-xs font-bold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💼</span>
                  <span>LinkedIn Profile</span>
                </div>
                <span>↗</span>
              </a>
            ) : (
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-zinc-500 opacity-60 ${
                isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span>💼</span>
                <span>LinkedIn not provided</span>
              </div>
            )}

            {/* GitHub */}
            {student.github_url ? (
              <a
                href={student.github_url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl border flex items-center justify-between transition hover:scale-[1.02] bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/60 text-purple-300 text-xs font-bold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💻</span>
                  <span>GitHub Profile</span>
                </div>
                <span>↗</span>
              </a>
            ) : (
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-zinc-500 opacity-60 ${
                isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span>💻</span>
                <span>GitHub not provided</span>
              </div>
            )}

            {/* Twitter / X */}
            {student.twitter_url ? (
              <a
                href={student.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl border flex items-center justify-between transition hover:scale-[1.02] bg-sky-950/40 hover:bg-sky-900/60 border-sky-800/60 text-sky-300 text-xs font-bold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🐦</span>
                  <span>Twitter / X</span>
                </div>
                <span>↗</span>
              </a>
            ) : (
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-zinc-500 opacity-60 ${
                isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span>🐦</span>
                <span>Twitter/X not provided</span>
              </div>
            )}

            {/* Instagram */}
            {student.instagram_handle ? (
              <a
                href={`https://instagram.com/${student.instagram_handle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl border flex items-center justify-between transition hover:scale-[1.02] bg-pink-950/40 hover:bg-pink-900/60 border-pink-800/60 text-pink-300 text-xs font-bold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📸</span>
                  <span>@{student.instagram_handle.replace('@', '')}</span>
                </div>
                <span>↗</span>
              </a>
            ) : (
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-zinc-500 opacity-60 ${
                isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span>📸</span>
                <span>Instagram not provided</span>
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Performance Metrics Grid */}
        <div className="space-y-3">
          <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Performance Analytics Overview
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Earned Score</p>
              <p className="text-2xl font-black text-amber-400">{student.total_score ?? 0} <span className="text-xs font-normal text-zinc-400">pts</span></p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Rank</p>
              <p className="text-xs font-black text-purple-400 truncate">{student.rank_label || 'Unranked'}</p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Streak</p>
              <p className="text-2xl font-black text-emerald-400">{student.current_streak} <span className="text-xs font-normal text-zinc-400">days</span></p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#08080c] border-zinc-800 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-inner'
            }`}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Completed</p>
              <p className="text-2xl font-black text-blue-400">{student.total_completed ?? 0} <span className="text-xs font-normal text-zinc-400">problems</span></p>
            </div>
          </div>
        </div>

        {/* Problem Solving History Timeline */}
        <div className="space-y-3 pt-2">
          <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Completed Problem History
          </h4>

          {!student.completed_history || student.completed_history.length === 0 ? (
            <p className={`text-xs italic ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              No completed problems recorded yet for this student.
            </p>
          ) : (
            <div className={`max-h-48 overflow-y-auto rounded-2xl border p-4 space-y-2.5 ${
              isDark ? 'bg-[#08080c] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {student.completed_history.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/40 last:border-0">
                  <div>
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="ml-2 text-[10px] text-blue-400 font-semibold">({item.difficulty})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-black">+{item.earned_score} pts</span>
                    {item.completed_at && (
                      <span className="text-[10px] text-zinc-500">
                        {new Date(item.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition border border-zinc-700"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  )
}
