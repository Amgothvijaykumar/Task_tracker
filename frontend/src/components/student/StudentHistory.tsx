import { HistoryItem, progressStatusColor, progressStatusLabel } from '../../lib/studentApi'
import { formatDate } from '../../lib/adminApi'
import { useTheme } from '../../contexts/ThemeContext'

interface StudentHistoryProps {
  qualifiedDates: string[]
  history: HistoryItem[]
}

export function StudentHistory({ qualifiedDates, history }: StudentHistoryProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className={`p-6 sm:p-8 rounded-3xl border transition space-y-6 ${
      isDark
        ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      <div>
        <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
          Progress History & Qualified Days
        </h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Qualified days are local calendar days (IST) with at least one completion.
        </p>
      </div>

      {qualifiedDates.length === 0 ? (
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          No qualified days yet. Complete one problem to start your streak.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pb-2">
          {qualifiedDates.slice(0, 21).map((date) => (
            <span
              key={date}
              className={`px-3 py-1 text-xs font-black rounded-xl border shadow-sm ${
                isDark
                  ? 'bg-gradient-to-b from-emerald-900 via-emerald-950 to-[#08080c] text-emerald-300 border-emerald-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
              }`}
            >
              {formatDate(date)}
            </span>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          No status history yet.
        </p>
      ) : (
        <ul className={`divide-y border-t pt-2 ${
          isDark ? 'divide-zinc-900 border-zinc-900' : 'divide-slate-100 border-slate-100'
        }`}>
          {history.slice(0, 20).map((item) => (
            <li key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className={`font-bold text-xs sm:text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  {item.problem_title}
                </p>
                <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Scheduled {formatDate(item.scheduled_date)}
                </p>
              </div>
              <span className={`inline-block px-3 py-0.5 text-xs font-black rounded-lg self-start shadow-sm ${progressStatusColor(item.status)}`}>
                {progressStatusLabel(item.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
