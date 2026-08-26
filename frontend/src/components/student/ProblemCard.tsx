import {
  StatusAction,
  StudentProblem,
  progressStatusColor,
  progressStatusLabel,
} from '../../lib/studentApi'
import { difficultyColor } from '../../lib/adminApi'
import { useTheme } from '../../contexts/ThemeContext'

interface ProblemCardProps {
  problem: StudentProblem
  busy: boolean
  onAction: (problem: StudentProblem, action: StatusAction) => void
  onShare: (problem: StudentProblem) => void
}

export function ProblemCard({ problem, busy, onAction, onShare }: ProblemCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const status = problem.my_status
  const isAvailable = (action: StatusAction) => problem.available_actions.includes(action)

  return (
    <article className={`p-6 rounded-3xl border transition space-y-4 hover:scale-[1.005] ${
      isDark
        ? 'bg-gradient-to-b from-[#181820] to-[#0c0c10] border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.8)]'
        : 'bg-white border-slate-200 shadow-md'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h4 className={`text-lg font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
            {problem.title}
          </h4>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-block px-2.5 py-0.5 text-xs font-black rounded-md shadow-sm ${difficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>

            <span className={`inline-block px-2.5 py-0.5 text-xs font-black rounded-md shadow-sm ${progressStatusColor(status)}`}>
              {progressStatusLabel(status)}
            </span>

            {problem.estimated_minutes && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                isDark
                  ? 'text-zinc-300 bg-[#08080c] border-zinc-800 shadow-inner'
                  : 'text-slate-600 bg-slate-100 border-slate-200'
              }`} title="Estimated time to solve this problem">
                ⏱️ Est: {problem.estimated_minutes} mins
              </span>
            )}
          </div>
        </div>

        {problem.source_url && (
          <a
            href={problem.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/70 hover:bg-blue-900 border border-blue-800/80 px-3.5 py-1.5 rounded-xl whitespace-nowrap transition shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-95"
          >
            Open source ↗
          </a>
        )}
      </div>

      {problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {problem.tags.map((tag) => (
            <span key={tag.id} className={`text-[11px] font-semibold px-2.5 py-0.5 border rounded-lg ${
              isDark
                ? 'bg-[#08080c] text-zinc-300 border-zinc-800'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {problem.description && (
        <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-1 ${
          isDark ? 'text-zinc-300' : 'text-slate-600'
        }`}>
          {problem.description}
        </p>
      )}

      {/* Tactile Skeuomorphic Action Buttons */}
      <div className={`flex flex-wrap items-center gap-2.5 pt-4 border-t ${
        isDark ? 'border-zinc-800/80' : 'border-slate-100'
      }`}>
        {status === 'hidden' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction(problem, 'restore')}
            className="text-xs flex items-center gap-1.5 text-white font-black px-5 py-2 rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(16,185,129,0.4)] bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border border-emerald-800 active:scale-95"
          >
            <span>👁️</span> View it again
          </button>
        ) : status === 'completed' ? (
          <>
            <button
              type="button"
              onClick={() => onShare(problem)}
              className="text-xs flex items-center gap-1.5 text-white font-black px-5 py-2 rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(59,130,246,0.4)] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border border-blue-800 active:scale-95"
            >
              <span>📝</span> Share draft
            </button>
            {isAvailable('skip') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'skip')}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-95 ${
                  isDark
                    ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                Skip
              </button>
            )}
          </>
        ) : (
          <>
            {/* Assign Button */}
            {status === 'unassigned' && isAvailable('assign') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'assign')}
                className={`px-5 py-2 text-xs font-black rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_14px_rgba(255,255,255,0.2)] active:scale-95 ${
                  isDark ? 'bg-gradient-to-b from-white to-zinc-200 text-black border border-zinc-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Assign
              </button>
            )}

            {/* Start Button - Disabled until assigned */}
            {status === 'unassigned' && (
              <button
                type="button"
                disabled
                title="Please assign this problem first before starting"
                className={`px-4 py-2 text-xs font-semibold rounded-xl border cursor-not-allowed ${
                  isDark
                    ? 'bg-[#08080c] text-zinc-600 border-zinc-800 shadow-inner'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                Start (Assign first)
              </button>
            )}

            {status === 'assigned' && isAvailable('start') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'start')}
                className="px-5 py-2 text-xs font-black text-white rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(59,130,246,0.4)] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border border-blue-800 active:scale-95"
              >
                Start
              </button>
            )}

            {/* Complete Button - Enabled when started or assigned */}
            {status === 'started' && isAvailable('complete') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'complete')}
                className="px-5 py-2 text-xs font-black text-white rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(16,185,129,0.4)] bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border border-emerald-800 active:scale-95"
              >
                Complete
              </button>
            )}

            {/* Skip Button */}
            {isAvailable('skip') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'skip')}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-95 ${
                  isDark
                    ? 'text-zinc-300 hover:text-white bg-[#121218] hover:bg-zinc-800 border-zinc-700/80'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                Skip
              </button>
            )}

            {/* Hide Button */}
            {isAvailable('hide') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(problem, 'hide')}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-95 ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-200 bg-[#08080c] hover:bg-zinc-900 border-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
              >
                Hide
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}
