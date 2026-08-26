import React, { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Spline from '@splinetool/react-spline'
import '@splinetool/runtime'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'

export function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sceneLoaded, setSceneLoaded] = useState(false)

  // Auth state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, signInWithGoogle, user, userProfile } = useAuth()

  // Handle OAuth callback redirect
  if (user && userProfile) {
    const redirectPath = searchParams.get('redirect') || (userProfile.role === 'admin' ? '/admin' : '/dashboard')
    navigate(redirectPath, { replace: true })
  }

  const cursorX = useMotionValue(-500)
  const cursorY = useMotionValue(-500)

  const smoothX = useSpring(cursorX, {
    stiffness: 130,
    damping: 25,
    mass: 0.25,
  })

  const smoothY = useSpring(cursorY, {
    stiffness: 130,
    damping: 25,
    mass: 0.25,
  })

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const container = containerRef.current
    if (!container) return
    const bounds = container.getBoundingClientRect()
    cursorX.set(event.clientX - bounds.left)
    cursorY.set(event.clientY - bounds.top)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Name is required')
          setLoading(false)
          return
        }
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }

      navigate(userProfile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <motion.section
        ref={containerRef}
        className="hero"
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className="cursor-light"
          style={{
            x: smoothX,
            y: smoothY,
          }}
        />

        <div className="content">
          {/* Full-screen Spline layer */}
          <motion.div
            className="scene-area"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {!sceneLoaded && (
              <div className="loader-container">
                <span className="loader" />
                <p>Loading 3D scene</p>
              </div>
            )}

            <Spline
              scene={SCENE_URL}
              className="spline"
              onLoad={() => setSceneLoaded(true)}
            />

            <motion.div
              className="live-label"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="live-icon">
                <span />
              </span>

              <div>
                <strong>Live environment</strong>
                <small>Career With Chaitanya · DSA Tracker</small>
              </div>
            </motion.div>
          </motion.div>

          {/* Transparent text & Liquid Glass Auth Overlay */}
          <motion.div
            className="text-area"
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="eyebrow">
              <span />
              Career With Chaitanya Community
            </div>

            <h1>
              DSA Daily
              <span className="gradient-text">Tracker.</span>
            </h1>

            <p>
              Sign in to track your daily problem solving, maintain active streaks, and access free roadmaps & bootcamps by M Chaitanya.
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* LIQUID GLASS AUTH FORM */}
            <form onSubmit={handleSubmit} className="auth-form liquid-glass">
              {/* Animated Liquid Gradient Back-Glow */}
              <div className="liquid-glow-orb" />
              <div className="liquid-sheen" />

              {isSignUp && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                    className="liquid-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  className="liquid-input"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="liquid-input"
                />
              </div>

              <div className="buttons">
                <button type="submit" disabled={loading} className="primary-button liquid-btn-primary">
                  {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12H19M13 6L19 12L13 18" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="secondary-button liquid-btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>
            </form>

            <div className="auth-toggle">
              <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Embedded CSS styles matching Liquid Glass design */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          min-height: 100%;
          margin: 0;
        }

        body {
          overflow: hidden;
          background: #050506;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font: inherit;
        }

        .page {
          width: 100%;
          height: 100vh;
          height: 100svh;
          height: 100dvh;
          margin: 0;
          padding: 0;
          overflow: hidden;
          color: white;
          background: #050506;
        }

        .hero {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background: #050506;
        }

        .cursor-light {
          position: absolute;
          top: -250px;
          left: -250px;
          z-index: 20;
          width: 500px;
          height: 500px;
          pointer-events: none;
          border-radius: 50%;
          opacity: 0.65;
          filter: blur(16px);
          mix-blend-mode: screen;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.12),
            rgba(135, 101, 255, 0.07) 30%,
            transparent 70%
          );
        }

        .content {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background: #050506;
        }

        .scene-area {
          position: absolute;
          inset: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          overflow: visible;
          background: #050506;
        }

        .spline {
          position: absolute !important;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
          background: #050506;
          transform: translateX(15%) scale(1.08);
          transform-origin: center center;
        }

        .spline canvas {
          width: 100% !important;
          height: 100% !important;
          background: #050506 !important;
        }

        .text-area {
          position: absolute;
          top: 0;
          bottom: 0;
          left: clamp(40px, 7vw, 130px);
          z-index: 10;
          display: flex;
          width: clamp(380px, 42vw, 520px);
          min-width: 0;
          min-height: 0;
          flex-direction: column;
          justify-content: center;
          padding: clamp(20px, 4vh, 50px) 0;
          pointer-events: none;
          background: transparent;
        }

        .text-area button,
        .text-area input,
        .text-area form,
        .text-area .auth-toggle {
          pointer-events: auto;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          margin-bottom: clamp(10px, 1.8vh, 18px);
          padding: 6px 14px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(20px);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .eyebrow > span {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow:
            0 0 10px #a78bfa,
            0 0 20px rgba(167, 139, 250, 0.9);
        }

        h1 {
          max-width: 620px;
          margin: 0;
          color: #f5f5f7;
          font-size: clamp(40px, min(5vw, 8vh), 70px);
          font-weight: 600;
          line-height: 0.92;
          letter-spacing: -0.06em;
        }

        .gradient-text {
          display: block;
          padding-bottom: clamp(4px, 1vh, 8px);
          color: transparent;
          background: linear-gradient(
            135deg,
            #ffffff,
            #c4b5fd 48%,
            #8b5cf6
          );
          background-clip: text;
          -webkit-background-clip: text;
        }

        .text-area > p {
          max-width: 440px;
          margin: clamp(10px, 1.6vh, 16px) 0 0;
          color: rgba(255, 255, 255, 0.65);
          font-size: clamp(12px, 1vw, 14px);
          line-height: 1.55;
        }

        .auth-error {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          font-size: 12px;
          max-width: 440px;
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }

        /* LIQUID GLASS AUTH FORM CONTAINER */
        .auth-form.liquid-glass {
          position: relative;
          isolation: isolate;
          margin-top: clamp(14px, 2.2vh, 22px);
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.6vh, 16px);
          width: 100%;
          max-width: 440px;
          padding: 26px;
          border-radius: 26px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.02) 40%,
            rgba(167, 139, 250, 0.06) 70%,
            rgba(255, 255, 255, 0.08) 100%
          );
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.4),
            inset 0 -1px 1px rgba(0, 0, 0, 0.3),
            0 25px 50px -10px rgba(0, 0, 0, 0.7),
            0 0 40px rgba(167, 139, 250, 0.12);
          overflow: hidden;
          transition: border-color 300ms ease, box-shadow 300ms ease;
        }

        .auth-form.liquid-glass:hover {
          border-color: rgba(255, 255, 255, 0.26);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.5),
            inset 0 -1px 1px rgba(0, 0, 0, 0.3),
            0 30px 60px -10px rgba(0, 0, 0, 0.8),
            0 0 50px rgba(167, 139, 250, 0.2);
        }

        /* Animated Liquid Glow Orb Behind Glass */
        .liquid-glow-orb {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%);
          filter: blur(30px);
          pointer-events: none;
          z-index: -1;
          animation: liquidMorph 8s infinite ease-in-out alternate;
        }

        .liquid-sheen {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
          pointer-events: none;
          border-radius: 26px 26px 0 0;
        }

        @keyframes liquidMorph {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30px, 40px) scale(1.2);
          }
          100% {
            transform: translate(20px, -20px) scale(0.9);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          position: relative;
          z-index: 2;
        }

        .form-group label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* LIQUID GLASS INPUT FIELDS */
        .liquid-input {
          width: 100%;
          height: clamp(40px, 5vh, 46px);
          padding: 0 16px;
          color: white;
          font-size: 13.5px;
          font-weight: 500;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          backdrop-filter: blur(16px);
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 220ms ease;
        }

        .liquid-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .liquid-input:focus {
          border-color: rgba(167, 139, 250, 0.8);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(167, 139, 250, 0.08) 100%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(167, 139, 250, 0.35);
        }

        .buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: clamp(8px, 1.5vh, 14px);
          position: relative;
          z-index: 2;
        }

        .primary-button,
        .secondary-button {
          height: clamp(44px, 5.4vh, 50px);
          padding: 0 20px;
          cursor: pointer;
          border-radius: 999px;
          transition:
            transform 220ms ease,
            background 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease;
        }

        /* LIQUID GLASS PRIMARY BUTTON */
        .liquid-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #050508;
          font-size: 13.5px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.8);
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f5 50%, #e2e2ec 100%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.9),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2),
            0 10px 25px rgba(255, 255, 255, 0.2);
          flex: 1;
        }

        .liquid-btn-primary svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 220ms ease;
        }

        .liquid-btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(180deg, #ffffff 0%, #ffffff 100%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 15px 35px rgba(255, 255, 255, 0.35);
        }

        .liquid-btn-primary:hover svg {
          transform: translateX(4px);
        }

        /* LIQUID GLASS SECONDARY BUTTON */
        .liquid-btn-secondary {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13.5px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(16px);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .liquid-btn-secondary:hover {
          transform: translateY(-2px);
          color: white;
          border-color: rgba(255, 255, 255, 0.35);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.5),
            0 8px 20px rgba(0, 0, 0, 0.5);
        }

        .auth-toggle {
          margin-top: clamp(10px, 1.8vh, 16px);
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-toggle button {
          color: #c4b5fd;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
          text-decoration: underline;
          transition: color 200ms ease;
        }

        .auth-toggle button:hover {
          color: #ffffff;
        }

        .loader-container {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 13px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          background: #050506;
        }

        .loader-container p {
          margin: 0;
        }

        .loader {
          width: 34px;
          height: 34px;
          border: 2px solid rgba(255, 255, 255, 0.12);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .live-label {
          position: absolute;
          right: clamp(18px, 2.5vw, 35px);
          bottom: max(
            clamp(20px, 3.5vh, 35px),
            env(safe-area-inset-bottom)
          );
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: calc(100% - 36px);
          padding: 12px 14px;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(12, 12, 16, 0.85) 0%, rgba(20, 20, 28, 0.75) 100%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.2),
            0 18px 45px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
        }

        .live-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border: 1px solid rgba(158, 130, 255, 0.3);
          border-radius: 10px;
          background: rgba(139, 107, 255, 0.2);
        }

        .live-icon span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow:
            0 0 10px #a78bfa,
            0 0 20px rgba(167, 139, 250, 0.9);
        }

        .live-label > div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }

        .live-label strong {
          color: rgba(255, 255, 255, 0.95);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .live-label small {
          color: rgba(255, 255, 255, 0.45);
          font-size: 9px;
          white-space: nowrap;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          body {
            overflow-y: auto;
          }

          .page {
            min-height: 100vh;
            height: auto;
            overflow: visible;
          }

          .hero {
            min-height: 100vh;
            height: auto;
            overflow: hidden;
          }

          .content {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(460px, 1fr);
            min-height: 100vh;
            overflow: visible;
          }

          .text-area {
            position: relative;
            inset: auto;
            width: 100%;
            height: auto;
            padding: 50px 25px 20px;
          }

          .scene-area {
            position: relative;
            inset: auto;
            width: 100%;
            min-height: 460px;
            overflow: hidden;
          }

          .spline {
            transform: none;
          }

          h1 {
            font-size: clamp(44px, 11vw, 70px);
          }
        }
      `}</style>
    </main>
  )
}
