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
                <th className="pb-3 font-bold uppercase tracking-wider">Last Completion</th>
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
                  <td className={`py-4 text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    {s.last_completion
                      ? new Date(s.last_completion).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
