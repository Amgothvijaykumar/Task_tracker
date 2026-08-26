import { useCallback, useEffect, useState } from 'react'
import {
  AdminProblem,
  ProblemFilters,
  Tag,
  archiveProblem,
  fetchAdminProblems,
  fetchAdminTags,
  formatDate,
  publishProblem,
  unpublishProblem,
} from '../../lib/adminApi'
import { DifficultyBadge, ProblemFormModal, StatusBadge } from './ProblemFormModal'
import { useTheme } from '../../contexts/ThemeContext'

interface AdminProblemsProps {
  token: string
}

export function AdminProblems({ token }: AdminProblemsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [problems, setProblems] = useState<AdminProblem[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProblemFilters>({})
  const [showForm, setShowForm] = useState(false)
  const [editingProblem, setEditingProblem] = useState<AdminProblem | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadProblems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminProblems(token, filters)
      setProblems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [token, filters])

  useEffect(() => {
    loadProblems()
  }, [loadProblems])

  useEffect(() => {
    fetchAdminTags(token).then(setTags).catch(() => {})
  }, [token])

  const handleAction = async (id: number, action: 'publish' | 'unpublish' | 'archive') => {
    setActionLoading(id)
    try {
      if (action === 'publish') await publishProblem(token, id)
      else if (action === 'unpublish') await unpublishProblem(token, id)
      else await archiveProblem(token, id)
      await loadProblems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const openCreate = () => {
    setEditingProblem(null)
    setShowForm(true)
  }

  const openEdit = (problem: AdminProblem) => {
    setEditingProblem(problem)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Title & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
            Manage Problems
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Create, schedule, publish, and manage daily DSA challenges.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 text-xs font-black text-white rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(225,29,72,0.4)] bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 border border-rose-800 active:scale-95 flex items-center gap-2"
        >
          <span className="text-sm">+</span> Create Problem
        </button>
      </div>

      {/* Tactile Skeuomorphic Filters Card */}
      <div className={`p-6 rounded-3xl border transition ${
        isDark
          ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_-5px_rgba(0,0,0,0.8)]'
          : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Scheduled Date
            </label>
            <input
              type="date"
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
                  : 'text-slate-900 bg-white border-slate-300 shadow-inner'
              }`}
              value={filters.scheduled_date || ''}
              onChange={(e) => setFilters({ ...filters, scheduled_date: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Status
            </label>
            <select
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
                  : 'text-slate-900 bg-white border-slate-300 shadow-inner'
              }`}
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Difficulty
            </label>
            <select
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
                  : 'text-slate-900 bg-white border-slate-300 shadow-inner'
              }`}
              value={filters.difficulty || ''}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value || undefined })}
            >
              <option value="">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Tag
            </label>
            <select
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:border-rose-500'
                  : 'text-slate-900 bg-white border-slate-300 shadow-inner'
              }`}
              value={filters.tag || ''}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value || undefined })}
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(filters.scheduled_date || filters.status || filters.difficulty || filters.tag) && (
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-xs font-extrabold text-rose-400 hover:text-rose-300 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-16 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          Loading problems...
        </div>
      ) : problems.length === 0 ? (
        <div className={`p-8 rounded-3xl border text-center space-y-3 ${
          isDark
            ? 'bg-gradient-to-b from-[#16161c] to-[#0c0c10] border-zinc-700/60 shadow-xl'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <p className={`text-base font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>No problems found</p>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Create your first daily DSA problem</p>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(225,29,72,0.4)] bg-gradient-to-b from-rose-500 to-rose-700 border border-rose-800"
          >
            Create First Problem
          </button>
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
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Title</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Date</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Difficulty</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Status</th>
                <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Progress</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-slate-100'}`}>
              {problems.map((p) => (
                <tr key={p.id} className={`transition ${isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-slate-50'}`}>
                  <td className="py-4 pr-4">
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</p>
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.tags.map((t) => (
                          <span key={t.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            isDark ? 'bg-[#08080c] text-zinc-300 border-zinc-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>{t.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={`py-4 pr-4 whitespace-nowrap font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{formatDate(p.scheduled_date)}</td>
                  <td className="py-4 pr-4"><DifficultyBadge difficulty={p.difficulty} /></td>
                  <td className="py-4 pr-4"><StatusBadge status={p.publication_status} /></td>
                  <td className={`py-4 pr-4 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    <span className="text-emerald-400 font-bold">{p.stats.completed} done</span>
                    {' · '}
                    <span>{p.stats.started} started</span>
                    {' · '}
                    <span>{p.stats.skipped} skip</span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-sm ${
                          isDark
                            ? 'bg-[#121218] hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        Edit
                      </button>
                      {p.publication_status !== 'published' && (
                        <button
                          onClick={() => handleAction(p.id, 'publish')}
                          disabled={actionLoading === p.id}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl text-emerald-300 bg-gradient-to-b from-emerald-800 to-emerald-950 border border-emerald-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition active:scale-95"
                        >
                          Publish
                        </button>
                      )}
                      {p.publication_status === 'published' && (
                        <button
                          onClick={() => handleAction(p.id, 'unpublish')}
                          disabled={actionLoading === p.id}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                            isDark
                              ? 'bg-[#121218] hover:bg-zinc-800 text-zinc-400 border-zinc-700/80'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          Unpublish
                        </button>
                      )}
                      {p.publication_status !== 'archived' && (
                        <button
                          onClick={() => handleAction(p.id, 'archive')}
                          disabled={actionLoading === p.id}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl text-amber-300 bg-gradient-to-b from-amber-800 to-amber-950 border border-amber-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition active:scale-95"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProblemFormModal
          token={token}
          problem={editingProblem}
          tags={tags}
          onClose={() => setShowForm(false)}
          onSaved={loadProblems}
        />
      )}
    </div>
  )
}
