import { useState } from 'react'
import {
  LINKEDIN_FEED_URL,
  StudentProblem,
  recordShareClick,
} from '../../lib/studentApi'
import { useTheme } from '../../contexts/ThemeContext'

interface ShareModalProps {
  token: string
  problem: StudentProblem
  draft: string
  onClose: () => void
}

export function ShareModal({ token, problem, draft, onClose }: ShareModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [text, setText] = useState(draft)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setError('Unable to copy automatically. Please select the text and copy it manually.')
    }
  }

  const handleOpenLinkedIn = async () => {
    setError(null)

    // 1. Auto-copy draft text to clipboard so it's immediately ready to paste
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // ignore clipboard error fallback
    }

    // 2. Record share click API metric
    try {
      await recordShareClick(token, problem.id)
    } catch (err) {
      console.error('Could not record share click:', err)
    }

    // 3. Mobile / Web Share API support if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DSA Daily Tracker - ${problem.title}`,
          text: text,
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    // 4. Desktop: Open LinkedIn feed with post composer active
    window.open(LINKEDIN_FEED_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`rounded-3xl border shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-gradient-to-b from-[#181820] to-[#0a0a0e] border-zinc-700/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.9)]' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div>
            <h3 className="text-xl font-black tracking-tight">Share on LinkedIn</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Edit your post draft, copy it, or open LinkedIn.</p>
          </div>
          <button onClick={onClose} className={`text-2xl leading-none transition ${
            isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
          }`} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          {copied && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-inner">
              <span>✓</span>
              <span><strong>Draft copied to clipboard!</strong> Paste it (Cmd+V or Ctrl+V) into the LinkedIn post composer.</span>
            </div>
          )}

          {error && <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 text-rose-300 rounded-2xl text-xs">{error}</div>}

          <textarea
            className={`w-full p-4 font-mono text-xs rounded-2xl border focus:outline-none min-h-[220px] transition ${
              isDark
                ? 'text-white bg-[#08080c] border-zinc-700/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] focus:border-blue-500'
                : 'text-slate-900 bg-white border-slate-300 shadow-inner'
            }`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="LinkedIn post draft"
          />

          <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Clicking <strong>Open LinkedIn</strong> automatically copies your text to the clipboard and opens LinkedIn's post composer.
          </p>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                isDark ? 'bg-[#121218] hover:bg-zinc-800 text-zinc-400 border-zinc-700/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                isDark ? 'bg-[#14141c] hover:bg-zinc-800 text-zinc-200 border-zinc-700/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
            <button
              type="button"
              onClick={handleOpenLinkedIn}
              className="px-5 py-2 text-xs font-black text-white rounded-xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(59,130,246,0.4)] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border border-blue-800 active:scale-95 flex items-center gap-1.5"
            >
              <span>🚀</span> Open LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
