import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import profileImg from '../assets/profile.png'

interface SpotlightConfig {
  text: string
  radius: number
  dimColor: string
  brightColor: string
  smoothness: number
  openSpeed: number
}

const INSTAGRAM_URL = "https://www.instagram.com/careerwithchaitanya?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=="
const YOUTUBE_URL = "https://www.youtube.com/@careerwithchaitanya"
const WHATSAPP_URL = "https://chat.whatsapp.com/EyP03LwnqySKVBCmR6HW0m?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAcGRvZgJleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA85MzY2MTk3NDMzOTI0NTkAAaeA3wo8CKi2nzk8ySf0N7idJPRBlhcc3elJ14G01Ip7y2cCgmwbWaegoRV7sw_aem_BJ8a1XP4X8DUsid_ZFVotQ"

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sectionRef = useRef<HTMLDivElement>(null)

  // Spotlight configuration options
  const config: SpotlightConfig = {
    text: "SOME THINGS ONLY APPEAR WHEN YOU LOOK CLOSER.",
    radius: 175,
    dimColor: "rgba(255, 255, 255, 0.12)",
    brightColor: "#ffffff",
    smoothness: 0.12, // Lerp factor for natural delay
    openSpeed: 0.08,  // Smooth expansion speed
  }

  const [isHovered, setIsHovered] = useState(false)
  const targetPos = useRef({ x: -500, y: -500 })
  const currentPos = useRef({ x: -500, y: -500 })
  const currentRadius = useRef(0)
  const [maskState, setMaskState] = useState({ x: -500, y: -500, radius: 0 })
  const animFrameId = useRef<number | null>(null)

  useEffect(() => {
    const updateAnimation = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * config.smoothness
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * config.smoothness

      const destRadius = isHovered ? config.radius : 0
      currentRadius.current += (destRadius - currentRadius.current) * config.openSpeed

      setMaskState({
        x: currentPos.current.x,
        y: currentPos.current.y,
        radius: Math.max(0, currentRadius.current),
      })

      animFrameId.current = requestAnimationFrame(updateAnimation)
    }

    animFrameId.current = requestAnimationFrame(updateAnimation)

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    }
  }, [isHovered, config.radius, config.smoothness, config.openSpeed])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    targetPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true)
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    targetPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleExploreClick = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explore-section')
    exploreSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const maskImageStyle = `radial-gradient(circle ${maskState.radius}px at ${maskState.x}px ${maskState.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 100%)`

  return (
    <div className="bg-black text-white min-h-screen selection:bg-blue-600 selection:text-white font-sans">
      {/* 1. Full-Screen Spotlight Intro Section */}
      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden cursor-none select-none"
      >
        <div className="absolute top-8 flex items-center gap-3 z-10 pointer-events-auto">
          <span className="px-4 py-1.5 bg-blue-950/80 border border-blue-500/40 rounded-full text-xs font-black uppercase tracking-widest text-blue-300 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_15px_rgba(59,130,246,0.3)]">
            Career With Chaitanya
          </span>
        </div>

        <div className="relative w-full max-w-6xl px-6 flex items-center justify-center">
          {/* Bottom Dim Layer */}
          <h1
            className="text-4xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black uppercase tracking-tighter leading-[0.9] text-center select-none"
            style={{ color: config.dimColor }}
          >
            {config.text}
          </h1>

          {/* Top Bright Layer (Masked by spotlight radial-gradient) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none px-6"
            style={{
              WebkitMaskImage: maskImageStyle,
              maskImage: maskImageStyle,
            }}
          >
            <h1
              className="text-4xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black uppercase tracking-tighter leading-[0.9] text-center"
              style={{ color: config.brightColor }}
            >
              {config.text}
            </h1>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={scrollToExplore}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition duration-300 pointer-events-auto"
        >
          <span>Slide down to explore Career With Chaitanya</span>
          <span className="animate-bounce text-lg">↓</span>
        </button>
      </section>

      {/* 2. LIQUID GLASS EXPLORE SECTION: Career With Chaitanya Platform */}
      <section id="explore-section" className="relative bg-[#050506] border-t border-zinc-900/80 py-20 px-4 sm:px-8 overflow-hidden">
        {/* Dynamic Background Ambient Liquid Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/10 via-blue-600/15 to-pink-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto space-y-20 z-10">
          
          {/* Top Liquid Glass Branding & Social Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border transition duration-300 bg-gradient-to-br from-white/10 via-white/[0.02] to-purple-500/[0.05] backdrop-blur-3xl border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_20px_50px_rgba(0,0,0,0.8)]">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
                Career With Chaitanya
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
                Empowering B.Tech Graduates & Freshers across India · Hyderabad
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_15px_rgba(219,39,119,0.4)] transition active:scale-95"
              >
                <span>📸</span> Instagram (20K+)
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_15px_rgba(220,38,38,0.4)] transition active:scale-95"
              >
                <span>▶️</span> YouTube
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_15px_rgba(16,185,129,0.4)] transition active:scale-95"
              >
                <span>💬</span> Join WhatsApp
              </a>
              <button
                onClick={handleExploreClick}
                className="px-5 py-2.5 bg-gradient-to-b from-white to-zinc-200 hover:bg-white text-black font-black text-xs rounded-2xl transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_15px_rgba(255,255,255,0.3)] active:scale-95"
              >
                Sign In ↗
              </button>
            </div>
          </div>

          {/* About M Chaitanya Hero Liquid Glass Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl border transition duration-300 bg-gradient-to-br from-white/10 via-zinc-900/50 to-blue-600/10 backdrop-blur-3xl border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_25px_60px_rgba(0,0,0,0.85)]">
            <div className="lg:col-span-8 space-y-6">
              <span className="inline-block px-3.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-500/40 rounded-full text-xs font-black uppercase tracking-wider shadow-inner">
                About the Mentor
              </span>

              <div className="flex items-center gap-4">
                <img
                  src={profileImg}
                  alt="M Chaitanya"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-400/80 object-cover object-top shadow-[0_0_25px_rgba(59,130,246,0.5)] ring-4 ring-blue-500/30"
                />
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
                    M Chaitanya
                  </h2>
                  <p className="text-xs text-blue-400 font-bold mt-1">Career Mentor · Ex-IBM · Ex-Cigniti</p>
                </div>
              </div>

              <p className="text-base sm:text-lg text-gray-200 font-medium leading-relaxed">
                Career mentor, <strong className="text-white font-black">ex-IBM</strong> and <strong className="text-white font-black">ex-Cigniti</strong> professional, based in Hyderabad.
                He runs <strong className="text-white font-black">CareerWithChaitanya</strong> (20K+ Instagram community), helping B.Tech graduates and freshers get placed in high-growth tech roles.
              </p>

              {/* Formula Glass Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-white/10 via-zinc-900/80 to-blue-950/40 border border-white/15 backdrop-blur-xl text-sm text-gray-200 space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <p className="font-extrabold text-white">His Core Formula:</p>
                <div className="flex flex-wrap items-center gap-2 font-black text-blue-400">
                  <span>Skills</span> <span>→</span>
                  <span>Projects</span> <span>→</span>
                  <span>Guidance</span> <span>→</span>
                  <span>Internships</span> <span>→</span>
                  <span className="text-emerald-400 font-black">Jobs</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 font-medium">
                🗣️ Speaks in <strong className="text-white font-bold">Telugu + English</strong> so students from Hyderabad, Bengaluru, and Telugu states understand career concepts clearly without heavy corporate jargon.
              </p>
            </div>

            {/* Right Profile Liquid Glass Card */}
            <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl border bg-gradient-to-b from-white/10 to-zinc-950/80 border-white/20 backdrop-blur-2xl space-y-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.7)]">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-2 border-blue-400/80 shadow-[0_0_30px_rgba(59,130,246,0.6)] ring-4 ring-blue-500/30">
                <img
                  src={profileImg}
                  alt="M Chaitanya - Career Mentor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">CareerWithChaitanya</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">20,000+ Students & Aspirants Mentored</p>
              </div>
              
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(219,39,119,0.4)] transition active:scale-95"
              >
                Follow @careerwithchaitanya
              </a>
            </div>
          </div>

          {/* What We Do Section (5 Pillars Liquid Glass Cards) */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">What We Do</h3>
              <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2">Comprehensive career execution system built for freshers and job seekers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Pillar 1 */}
              <div className="p-6 sm:p-8 rounded-3xl border transition duration-300 hover:-translate-y-1.5 bg-gradient-to-br from-white/10 via-white/[0.02] to-blue-500/[0.05] backdrop-blur-2xl border-white/15 hover:border-blue-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.6)]">
                <div className="text-3xl mb-3">🗺️</div>
                <h4 className="text-lg font-black text-white mb-2">1. Free Career Roadmaps</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Built 90-day action plans for Data Analyst, AI Engineer, and tech roles by analyzing 100+ real job descriptions.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 sm:p-8 rounded-3xl border transition duration-300 hover:-translate-y-1.5 bg-gradient-to-br from-white/10 via-white/[0.02] to-indigo-500/[0.05] backdrop-blur-2xl border-white/15 hover:border-indigo-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.6)]">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-lg font-black text-white mb-2">2. AI & Tech Bootcamps</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Free bootcamps like the 45-Day AI Agents Bootcamp (1000+ students). Shares 2026 salary reports: Entry ₹6–12 LPA | Mid ₹15–30 LPA | Senior ₹30–60+ LPA.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 sm:p-8 rounded-3xl border transition duration-300 hover:-translate-y-1.5 bg-gradient-to-br from-white/10 via-white/[0.02] to-amber-500/[0.05] backdrop-blur-2xl border-white/15 hover:border-amber-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.6)]">
                <div className="text-3xl mb-3">🛠️</div>
                <h4 className="text-lg font-black text-white mb-2">3. Practical Student Tools</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  ATS resume templates (LinkedIn + Overleaf), Excel for Data Analysis site with 100 Q&A, and curated remote job directories (NoDesk, Wellfound, We Work Remotely).
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-6 sm:p-8 rounded-3xl border transition duration-300 hover:-translate-y-1.5 bg-gradient-to-br from-white/10 via-white/[0.02] to-purple-500/[0.05] backdrop-blur-2xl border-white/15 hover:border-purple-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.6)]">
                <div className="text-3xl mb-3">🎥</div>
                <h4 className="text-lg font-black text-white mb-2">4. Daily Guidance & Reels</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Daily Instagram reels breaking down interview prep, essential skills, building deployable projects, and avoiding common placement mistakes.
                </p>
              </div>

              {/* Pillar 5 */}
              <div className="p-6 sm:p-8 rounded-3xl border transition duration-300 hover:-translate-y-1.5 bg-gradient-to-br from-white/10 via-white/[0.02] to-emerald-500/[0.05] backdrop-blur-2xl border-white/15 hover:border-emerald-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_15px_35px_rgba(0,0,0,0.6)] lg:col-span-2">
                <div className="text-3xl mb-3">💬</div>
                <h4 className="text-lg font-black text-white mb-2">5. Community Building & Direct DMs</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Responds to DMs and comments directly. Students comment keywords like "LLM", "JOB", "excel", or "Remote" and get free learning resources sent straight to them.
                </p>
              </div>

            </div>
          </div>

          {/* What We Focus On vs What We Not Do Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Focuses On Liquid Emerald Glass Card */}
            <div className="p-8 sm:p-10 rounded-3xl border transition duration-300 bg-gradient-to-br from-emerald-950/30 via-zinc-900/60 to-emerald-900/20 backdrop-blur-3xl border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_45px_rgba(0,0,0,0.7)] space-y-5">
              <span className="inline-block px-3.5 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black tracking-wider uppercase shadow-inner">
                What We Focus On
              </span>
              <ul className="space-y-3.5 text-xs sm:text-sm text-gray-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black text-base">✓</span>
                  <span><strong className="text-white">Freshers and 2024–2026 graduates</strong> who know Python/SQL/Java but need placement execution.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black text-base">✓</span>
                  <span><strong className="text-white">Deployable projects + Communication + Domain depth</strong> over generic theory.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black text-base">✓</span>
                  <span><strong className="text-white">High-growth roles:</strong> Data Analyst, AI Engineer, Generative AI, Agentic AI, and USD remote jobs.</span>
                </li>
              </ul>
            </div>

            {/* What We Not Do Liquid Rose Glass Card */}
            <div className="p-8 sm:p-10 rounded-3xl border transition duration-300 bg-gradient-to-br from-rose-950/30 via-zinc-900/60 to-rose-900/20 backdrop-blur-3xl border-rose-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_45px_rgba(0,0,0,0.7)] space-y-5">
              <span className="inline-block px-3.5 py-1 bg-rose-950/90 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black tracking-wider uppercase shadow-inner">
                What We Not Do (Integrity First)
              </span>
              <ul className="space-y-3.5 text-xs sm:text-sm text-gray-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black text-base">✗</span>
                  <span><strong className="text-white">No paid courses with false promises</strong> — All core roadmaps, tools, and bootcamps are 100% free.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black text-base">✗</span>
                  <span><strong className="text-white">No generic "learn to code" content</strong> — Focuses strictly on job-relevant skills companies hire for right now.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black text-base">✗</span>
                  <span><strong className="text-white">No English-only coaching</strong> — Mentors in Telugu + English so students are never left behind.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black text-base">✗</span>
                  <span><strong className="text-white">No fake job guarantees</strong> — Gives you the roadmap & practice; placement depends on your daily task execution.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Why Task Tracker Quote Liquid Glass Card */}
          <div className="p-8 sm:p-12 rounded-3xl border transition duration-300 bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-blue-950/40 backdrop-blur-3xl border-blue-500/30 text-center space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_25px_60px_rgba(0,0,0,0.8)]">
            <span className="text-xs uppercase tracking-widest text-blue-300 font-black">Why This Task Tracker Website</span>
            <blockquote className="text-2xl sm:text-4xl font-black text-white leading-tight max-w-3xl mx-auto italic drop-shadow-md">
              "90–95% of students fail not due to lack of skills, but lack of consistency."
            </blockquote>
            <p className="text-xs sm:text-sm text-gray-200 font-medium max-w-xl mx-auto">
              This website is built specifically to help students track daily tasks, follow M Chaitanya's roadmaps, and stay accountable until they get placed in 2026.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_25px_rgba(59,130,246,0.5)] transition active:scale-95"
              >
                Start Daily Task Tracker ↗
              </button>
            </div>
          </div>

          {/* Mission & Links Footer */}
          <div className="pt-8 border-t border-zinc-900/80 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="text-sm font-black text-white">Mission 2026</p>
              <p className="text-xs text-gray-400 font-medium">Make every Indian graduate employable in 2026 · CareerWithChaitanya</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-400 transition">Instagram</a>
              <span>·</span>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-400 transition">YouTube</a>
              <span>·</span>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-emerald-400 transition">WhatsApp Community</a>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
