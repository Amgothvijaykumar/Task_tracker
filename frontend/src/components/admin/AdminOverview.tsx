import { AdminAnalytics, formatDate } from '../../lib/adminApi'
import { DifficultyBadge, StatusBadge } from './ProblemFormModal'
import { useTheme } from '../../contexts/ThemeContext'

interface AdminOverviewProps {
  data: AdminAnalytics | null
  loading: boolean
  error: string | null
  selectedDate: string
  onDateChange: (date: string) => void
}

export function AdminOverview({ data, loading, error, selectedDate, onDateChange }: AdminOverviewProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (loading) {
    return (
      <div className={`text-center py-16 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
        <div className="w-8 h-8 mx-auto mb-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        Loading analytics...
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-2xl text-xs shadow-lg">{error}</div>
  }

  if (!data) return null

  const maxTrend = Math.max(...data.trends.map((t) => Math.max(t.completions, t.active_students)), 1)

  return (
    <div className="space-y-8">
      {/* Overview Title & Date Select */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
            Overview & Analytics
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            All dates shown in {data.timezone} (IST)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="overview-date" className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
            Selected date:
          </label>
          <input
            id="overview-date"
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

      {/* Skeuomorphic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard isDark={isDark} label="Total Students" value={data.total_students} sub="Enrolled active students" icon="👥" />
        <KpiCard isDark={isDark} label="Active Students" value={data.active_students} sub="With activity on date" color="text-blue-400" icon="⚡" />
        <KpiCard isDark={isDark} label="Completions" value={data.completions} sub={`≥1 completion / ${data.total_students}`} color="text-emerald-400" icon="🎯" />
        <KpiCard isDark={isDark} label="Completion Rate" value={`${data.completion_rate}%`} sub="Of enrolled students" color="text-purple-400" icon="📈" />
        <KpiCard isDark={isDark} label="Share Clicks" value={data.share_clicks} sub="LinkedIn opens on date" color="text-amber-400" icon="📝" />
      </div>

      {/* Tactile Skeuomorphic 7-day Trends */}
      <section className={`p-6 sm:p-8 rounded-3xl border transition ${
        isDark
          ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
          : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            7-Day Trends Analytics
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/60 font-bold uppercase tracking-wider">
            Realtime Track
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-2 pt-4">
            {data.trends.map((day) => (
              <div key={day.date} className="flex-1 min-w-[85px] text-center">
                <p className={`text-[11px] mb-2 font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {formatDate(day.date)}
                </p>
                <div className={`flex gap-1.5 justify-center items-end h-28 p-2 rounded-xl border ${
                  isDark ? 'bg-[#08080c] border-zinc-800 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]' : 'bg-slate-50 border-slate-200 shadow-inner'
                }`}>
                  <div
                    className="w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-300"
                    style={{ height: `${(day.completions / maxTrend) * 100}%`, minHeight: day.completions > 0 ? '6px' : '0' }}
                    title={`${day.completions} completions`}
                  />
                  <div
                    className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md shadow-[0_0_10px_rgba(96,165,250,0.3)] transition-all duration-300"
                    style={{ height: `${(day.active_students / maxTrend) * 100}%`, minHeight: day.active_students > 0 ? '6px' : '0' }}
                    title={`${day.active_students} active`}
                  />
                </div>
                <div className="mt-2 flex justify-center gap-2 text-xs font-extrabold">
                  <span className="text-emerald-400">{day.completions}c</span>
                  <span className="text-blue-400">{day.active_students}a</span>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex gap-5 mt-4 text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.5)] inline-block" />
              Completions
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-blue-500 rounded-md shadow-[0_0_8px_rgba(59,130,246,0.5)] inline-block" />
              Active Students
            </span>
          </div>
        </div>
      </section>

      {/* Grid: Recent Problems & Inactive Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Problems */}
        <section className={`p-6 sm:p-8 rounded-3xl border transition ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <h3 className={`text-lg font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Recent Problems
          </h3>
          {data.recent_problems.length === 0 ? (
            <p className={`text-xs text-center py-8 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>No problems yet</p>
          ) : (
            <div className="space-y-3">
              {data.recent_problems.map((p) => (
                <div key={p.id} className={`p-4 rounded-2xl border transition ${
                  isDark
                    ? 'bg-[#0a0a0e] border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.6)]'
                    : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{formatDate(p.scheduled_date)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <DifficultyBadge difficulty={p.difficulty} />
                      <StatusBadge status={p.publication_status} />
                    </div>
                  </div>

                  <div className={`flex flex-wrap gap-2.5 mt-3 text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <span className="text-emerald-400 font-bold">{p.stats.completed} completed</span>
                    <span>·</span>
                    <span>{p.stats.started} started</span>
                    <span>·</span>
                    <span>{p.stats.skipped} skipped</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inactive Students */}
        <section className={`p-6 sm:p-8 rounded-3xl border transition ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div>
            <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Completion Yet
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Students with zero completions on {formatDate(selectedDate)}
            </p>
          </div>

          {data.inactive_students.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <span className="text-3xl">🎉</span>
              <p className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                All students have completed at least one problem!
              </p>
            </div>
          ) : (
            <ul className={`divide-y border-t pt-2 ${
              isDark ? 'divide-zinc-900 border-zinc-900' : 'divide-slate-100 border-slate-100'
            }`}>
              {data.inactive_students.map((s) => (
                <li key={s.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{s.name}</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{s.email}</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded-lg shadow-inner">
                    Inactive
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color = 'text-white',
  icon,
  isDark,
}: {
  label: string
  value: string | number
  sub: string
  color?: string
  icon: string
  isDark: boolean
}) {
  return (
    <div className={`p-5 rounded-2xl border transition hover:scale-[1.02] ${
      isDark
        ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
        : 'bg-white border-slate-200 shadow-md'
    }`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {label}
        </p>
        <span className="text-base">{icon}</span>
      </div>
      <p className={`text-3xl font-black mt-2.5 ${color} drop-shadow-sm`}>{value}</p>
      <p className={`text-[10px] font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{sub}</p>
    </div>
  )
}
