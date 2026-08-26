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

  const fillTestAccount = (testEmail: string, testPass: string) => {
    setEmail(testEmail)
    setPassword(testPass)
    setIsSignUp(false)
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

          {/* Transparent text & Auth Overlay */}
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

            <form onSubmit={handleSubmit} className="auth-form">
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
                />
              </div>

              <div className="buttons">
                <button type="submit" disabled={loading} className="primary-button">
                  {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12H19M13 6L19 12L13 18" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="secondary-button flex items-center gap-2"
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

      {/* Embedded CSS styles matching the user design */}
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
          padding: 6px 12px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 10px;
          font-weight: 650;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(14px);
        }

        .eyebrow > span {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow:
            0 0 10px #a78bfa,
            0 0 20px rgba(167, 139, 250, 0.7);
        }

        h1 {
          max-width: 620px;
          margin: 0;
          color: #f5f5f7;
          font-size: clamp(40px, min(5vw, 8vh), 70px);
          font-weight: 590;
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
            #b8a5ff 48%,
            #7565ff
          );
          background-clip: text;
          -webkit-background-clip: text;
        }

        .text-area > p {
          max-width: 440px;
          margin: clamp(10px, 1.6vh, 16px) 0 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: clamp(12px, 1vw, 14px);
          line-height: 1.55;
        }

        .auth-error {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 12px;
          max-width: 440px;
        }

        .auth-form {
          margin-top: clamp(14px, 2.2vh, 22px);
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.6vh, 16px);
          width: 100%;
          max-width: 440px;
          padding: 22px;
          border-radius: 20px;
          background: rgba(12, 12, 16, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          height: clamp(38px, 4.8vh, 44px);
          padding: 0 14px;
          color: white;
          font-size: 13px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
          outline: none;
          transition: border-color 200ms ease;
        }

        .form-group input:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.2);
        }

        .buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: clamp(8px, 1.5vh, 14px);
        }

        .primary-button,
        .secondary-button {
          height: clamp(42px, 5.2vh, 48px);
          padding: 0 18px;
          cursor: pointer;
          border-radius: 999px;
          transition:
            transform 220ms ease,
            background 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #090909;
          font-size: 13px;
          font-weight: 650;
          border: 0;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(255, 255, 255, 0.13);
          flex: 1;
        }

        .primary-button svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 220ms ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 38px rgba(255, 255, 255, 0.19);
        }

        .primary-button:hover svg {
          transform: translateX(3px);
        }

        .secondary-button {
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 550;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(14px);
        }

        .secondary-button:hover {
          transform: translateY(-2px);
          color: white;
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
        }

        .auth-toggle {
          margin-top: clamp(10px, 1.8vh, 16px);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-toggle button {
          color: #a78bfa;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          text-decoration: underline;
        }

        .features {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: clamp(14px, 2.5vh, 26px);
        }

        .features div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .features strong {
          color: rgba(255, 255, 255, 0.88);
          font-size: 11px;
          font-weight: 600;
        }

        .features span {
          color: rgba(255, 255, 255, 0.35);
          font-size: 10px;
        }

        .features i {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.12);
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
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          background: rgba(8, 8, 10, 0.72);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(18px);
        }

        .live-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border: 1px solid rgba(158, 130, 255, 0.2);
          border-radius: 10px;
          background: rgba(139, 107, 255, 0.14);
        }

        .live-icon span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow:
            0 0 10px #a78bfa,
            0 0 20px rgba(167, 139, 250, 0.8);
        }

        .live-label > div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }

        .live-label strong {
          color: rgba(255, 255, 255, 0.88);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .live-label small {
          color: rgba(255, 255, 255, 0.38);
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
