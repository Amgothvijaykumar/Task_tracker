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
          <span className="px-3 py-1 bg-blue-950/80 border border-blue-800/50 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-400">
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
          className="absolute bottom-10 flex flex-col items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-white transition duration-300 pointer-events-auto"
        >
          <span>Slide down to explore Career With Chaitanya</span>
          <span className="animate-bounce text-lg">↓</span>
        </button>
      </section>

      {/* 2. Slide Down Section: Career With Chaitanya Platform */}
      <section id="explore-section" className="relative bg-black border-t border-zinc-900 py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Top Branding & Social Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">Career With Chaitanya</h2>
              <p className="text-sm text-gray-400 mt-1">
                Empowering B.Tech Graduates & Freshers across India · Hyderabad
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
              >
                <span>📸</span> Instagram (20K+)
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
              >
                <span>▶️</span> YouTube
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
              >
                <span>💬</span> Join WhatsApp
              </a>
              <button
                onClick={handleExploreClick}
                className="px-5 py-2.5 bg-white hover:bg-gray-200 text-black font-bold text-xs rounded-xl transition shadow"
              >
                Sign In ↗
              </button>
            </div>
          </div>

          {/* About M Chaitanya Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-8 sm:p-12 rounded-3xl border border-zinc-800">
            <div className="lg:col-span-8 space-y-6">
              <span className="inline-block px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800/60 rounded-full text-xs font-semibold uppercase tracking-wider">
                About the Mentor
              </span>

              <div className="flex items-center gap-4">
                <img
                  src={profileImg}
                  alt="M Chaitanya"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-blue-500/60 object-cover object-top shadow-lg shadow-blue-900/30"
                />
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                    M Chaitanya
                  </h2>
                  <p className="text-xs text-blue-400 font-semibold mt-1">Career Mentor · Ex-IBM · Ex-Cigniti</p>
                </div>
              </div>

              <p className="text-lg text-gray-300 font-medium leading-relaxed">
                Career mentor, <strong className="text-white">ex-IBM</strong> and <strong className="text-white">ex-Cigniti</strong> professional, based in Hyderabad.
                He runs <strong className="text-white">CareerWithChaitanya</strong> (20K+ Instagram community), helping B.Tech graduates and freshers get placed in high-growth tech roles.
              </p>

              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-gray-300 space-y-2">
                <p className="font-semibold text-white">His Core Formula:</p>
                <div className="flex flex-wrap items-center gap-2 font-bold text-blue-400">
                  <span>Skills</span> <span>→</span>
                  <span>Projects</span> <span>→</span>
                  <span>Guidance</span> <span>→</span>
                  <span>Internships</span> <span>→</span>
                  <span className="text-emerald-400">Jobs</span>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                🗣️ Speaks in <strong className="text-gray-200">Telugu + English</strong> so students from Hyderabad, Bengaluru, and Telugu states understand career concepts clearly without heavy corporate jargon.
              </p>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-2 border-blue-500/60 shadow-xl shadow-blue-900/40">
                <img
                  src={profileImg}
                  alt="M Chaitanya - Career Mentor"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">CareerWithChaitanya</h3>
                <p className="text-xs text-gray-400 mt-0.5">20,000+ Students & Aspirants Mentored</p>
              </div>
              
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Follow @careerwithchaitanya
              </a>
            </div>
          </div>

          {/* What We Do Section (5 Pillars) */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-3xl sm:text-4xl font-black text-white">What We Do</h3>
              <p className="text-sm text-gray-400 mt-2">Comprehensive career execution system built for freshers and job seekers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-blue-600/50 transition">
                <div className="text-3xl mb-3">🗺️</div>
                <h4 className="text-lg font-bold text-white mb-2">1. Free Career Roadmaps</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Built 90-day action plans for Data Analyst, AI Engineer, and tech roles by analyzing 100+ real job descriptions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-blue-600/50 transition">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-lg font-bold text-white mb-2">2. AI & Tech Bootcamps</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Free bootcamps like the 45-Day AI Agents Bootcamp (1000+ students). Shares 2026 salary reports: Entry ₹6–12 LPA | Mid ₹15–30 LPA | Senior ₹30–60+ LPA.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-blue-600/50 transition">
                <div className="text-3xl mb-3">🛠️</div>
                <h4 className="text-lg font-bold text-white mb-2">3. Practical Student Tools</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  ATS resume templates (LinkedIn + Overleaf), Excel for Data Analysis site with 100 Q&A, and curated remote job directories (NoDesk, Wellfound, We Work Remotely).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-blue-600/50 transition">
                <div className="text-3xl mb-3">🎥</div>
                <h4 className="text-lg font-bold text-white mb-2">4. Daily Guidance & Reels</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Daily Instagram reels breaking down interview prep, essential skills, building deployable projects, and avoiding common placement mistakes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-blue-600/50 transition lg:col-span-2">
                <div className="text-3xl mb-3">💬</div>
                <h4 className="text-lg font-bold text-white mb-2">5. Community Building & Direct DMs</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Responds to DMs and comments directly. Students comment keywords like "LLM", "JOB", "excel", or "Remote" and get free learning resources sent straight to them.
                </p>
              </div>

            </div>
          </div>

          {/* What We Focus On vs What We Not Do Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Focuses On */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full text-xs font-semibold">
                What We Focus On
              </span>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Freshers and 2024–2026 graduates</strong> who know Python/SQL/Java but need placement execution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Deployable projects + Communication + Domain depth</strong> over generic theory.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>High-growth roles:</strong> Data Analyst, AI Engineer, Generative AI, Agentic AI, and USD remote jobs.</span>
                </li>
              </ul>
            </div>

            {/* What We Not Do */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <span className="px-3 py-1 bg-rose-950 text-rose-400 border border-rose-800/60 rounded-full text-xs font-semibold">
                What We Not Do (Integrity First)
              </span>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>No paid courses with false promises</strong> — All core roadmaps, tools, and bootcamps are 100% free.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>No generic "learn to code" content</strong> — Focuses strictly on job-relevant skills companies hire for right now.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>No English-only coaching</strong> — Mentors in Telugu + English so students are never left behind.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>No fake job guarantees</strong> — Gives you the roadmap & practice; placement depends on your daily task execution.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Why This Task Tracker Website Quote Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/80 via-zinc-900 to-purple-950/80 border border-blue-800/40 text-center space-y-6">
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">Why This Task Tracker Website</span>
            <blockquote className="text-2xl sm:text-4xl font-extrabold text-white leading-tight max-w-3xl mx-auto italic">
              "90–95% of students fail not due to lack of skills, but lack of consistency."
            </blockquote>
            <p className="text-sm text-gray-300 max-w-xl mx-auto">
              This website is built specifically to help students track daily tasks, follow M Chaitanya's roadmaps, and stay accountable until they get placed in 2026.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
              >
                Start Daily Task Tracker ↗
              </button>
            </div>
          </div>

          {/* Mission & Links Footer */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="text-sm font-bold text-white">Mission 2026</p>
              <p className="text-xs text-gray-400">Make every Indian graduate employable in 2026 · CareerWithChaitanya</p>
            </div>

            <div className="flex items-center gap-4 text-xs">
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
