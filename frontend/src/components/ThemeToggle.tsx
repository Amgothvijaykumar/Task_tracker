import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [isBurning, setIsBurning] = useState(false)
  const isDark = theme === 'dark'

  const handleClick = (e: React.MouseEvent) => {
    // Trigger burnout transition effect
    setIsBurning(true)

    // Toggle theme
    toggleTheme()

    // Reset burnout animation after duration
    setTimeout(() => {
      setIsBurning(false)
    }, 650)
  }

  return (
    <>
      {/* BURNOUT TRANSITION OVERLAY */}
      {isBurning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] animate-pulse" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none mix-blend-color-burn"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(244,63,94,0.8) 30%, rgba(167,139,250,0.6) 60%, transparent 100%)',
              animation: 'burnoutWipe 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(0,0,0,0.95) 100%)',
              animation: 'burnoutFlash 650ms ease-out forwards',
            }}
          />
        </div>
      )}

      {/* SKEUOMORPHIC GLASS TOGGLE BUTTON */}
      <button
        type="button"
        onClick={handleClick}
        className={`relative w-16 h-8 rounded-full p-0.5 transition-all duration-300 cursor-pointer flex items-center shadow-lg active:scale-95 ${
          isDark
            ? 'bg-gradient-to-r from-zinc-800 via-zinc-900 to-[#0c0c10] border border-zinc-700/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)]'
            : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 border border-slate-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)]'
        }`}
        title={`Click for Burnout Theme Transition to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Dark/Light Mode with Burnout Transition"
      >
        {/* Track Track Inner Specular Highlight */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* SLIDING SKEUOMORPHIC GLASS KNOB */}
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ease-out z-10 shadow-md ${
            isDark
              ? 'translate-x-8 bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-400 text-zinc-900 ring-2 ring-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.9)]'
              : 'translate-x-0.5 bg-gradient-to-br from-white via-slate-100 to-slate-200 text-amber-500 ring-2 ring-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,1)]'
          }`}
        >
          {/* Glass Specular Rim */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
          
          {/* Icon inside Knob */}
          <span className="text-xs select-none font-bold z-10">
            {isDark ? '🌙' : '☀️'}
          </span>
        </span>
      </button>

      {/* BURNOUT KEYFRAME STYLES */}
      <style>{`
        @keyframes burnoutWipe {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0.95;
            filter: brightness(2.5) contrast(3);
          }
          50% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0.85;
            filter: brightness(3.5) contrast(4);
          }
          100% {
            transform: translate(-50%, -50%) scale(10);
            opacity: 0;
            filter: brightness(1) contrast(1);
          }
        }

        @keyframes burnoutFlash {
          0% {
            opacity: 0;
          }
          30% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}
