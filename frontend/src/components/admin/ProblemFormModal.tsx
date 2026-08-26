import { useState } from 'react'
import {
  AdminProblem,
  ProblemFormData,
  Tag,
  createProblem,
  difficultyColor,
  statusColor,
  todayIST,
  updateProblem,
} from '../../lib/adminApi'
import { useTheme } from '../../contexts/ThemeContext'

interface ProblemFormModalProps {
  token: string
  problem?: AdminProblem | null
  tags: Tag[]
  onClose: () => void
  onSaved: () => void
}

const emptyForm = (): ProblemFormData => ({
  title: '',
  source_url: '',
  description: '',
  difficulty: 'Easy',
  scheduled_date: todayIST(),
  estimated_minutes: 30,
  publication_status: 'published',
  tag_names: [],
})

export function ProblemFormModal({ token, problem, tags, onClose, onSaved }: ProblemFormModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState<ProblemFormData>(() =>
    problem
      ? {
          title: problem.title,
          source_url: problem.source_url,
          description: problem.description || '',
          difficulty: problem.difficulty,
          scheduled_date: problem.scheduled_date,
          estimated_minutes: problem.estimated_minutes,
          publication_status: problem.publication_status,
          tag_names: problem.tags.map((t) => t.name),
        }
      : emptyForm()
  )
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (problem) {
        await updateProblem(token, problem.id, form)
      } else {
        await createProblem(token, form)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save problem')
    } finally {
      setSaving(false)
    }
  }

  const addTag = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || (form.tag_names?.length ?? 0) >= 5) return
    if (form.tag_names?.includes(trimmed)) return
    setForm({ ...form, tag_names: [...(form.tag_names || []), trimmed] })
    setTagInput('')
  }

  const removeTag = (name: string) => {
    setForm({ ...form, tag_names: (form.tag_names || []).filter((t) => t !== name) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`rounded-3xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <h3 className="text-xl font-bold tracking-tight">
            {problem ? 'Edit Problem' : 'Create Problem'}
          </h3>
          <button onClick={onClose} className={`text-2xl leading-none transition ${
            isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
          }`}>&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>Title *</label>
            <input
              type="text"
              required
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
              }`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 3Sum"
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>
              Problem URL (Optional)
            </label>
            <input
              type="text"
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
              }`}
              value={form.source_url || ''}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              placeholder="https://leetcode.com/problems/3sum/ (Optional)"
            />
            <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Leave empty if not linking to an external problem platform. Protocol (https://) will be auto-added.
            </p>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>Description / Hints</label>
            <textarea
              rows={3}
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
              }`}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes or hints..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>Difficulty *</label>
              <select
                className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                  isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
                }`}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>Scheduled Date *</label>
              <input
                type="date"
                required
                className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                  isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
                }`}
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>Est. Time (mins)</label>
              <input
                type="number"
                min={1}
                max={300}
                className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                  isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
                }`}
                value={form.estimated_minutes ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_minutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>Publication Status *</label>
            <select
              className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
              }`}
              value={form.publication_status}
              onChange={(e) => setForm({ ...form, publication_status: e.target.value as any })}
            >
              <option value="published">Published (Visible to students on scheduled date)</option>
              <option value="draft">Draft (Hidden from students)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>Tags (Max 5)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className={`flex-1 px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:border-rose-500 ${
                  isDark ? 'text-white bg-zinc-900 border-zinc-800' : 'text-slate-900 bg-white border-slate-300'
                }`}
                placeholder="Type new tag and press Add"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Add
              </button>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tag_names?.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-rose-400 hover:text-white font-bold ml-1">
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {/* Existing tags suggestions */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className={`text-[10px] uppercase font-bold self-center mr-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Suggestions:
                </span>
                {tags
                  .filter((t) => !form.tag_names?.includes(t.name))
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTag(t.name)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition ${
                        isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      + {t.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className={`pt-4 border-t flex justify-end gap-3 ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : problem ? 'Update Problem' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md ${difficultyColor(difficulty)}`}>
      {difficulty}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md ${statusColor(status)}`}>
      {status}
    </span>
  )
}
