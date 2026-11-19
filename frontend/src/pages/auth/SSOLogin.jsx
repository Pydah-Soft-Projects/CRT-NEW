/**
 * SSOLogin.jsx
 *
 * Landing page for students redirected from the SDMS portal.
 * URL shape: https://crt.pydah.edu.in/sso-login?token=<sdms_jwt> (legacy: https://crt.pydahsoft.in automatically redirects here)
 *
 * On mount it POSTs the token to /auth/sso-exchange, stores the
 * returned tokens, and redirects the student straight to /student.
 * If anything goes wrong it shows a friendly error with a link back
 * to the normal login page.
 */

import React, { useEffect, useRef, useState, useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const SSOLogin = () => {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const { setUser, user, loading } = useContext(AuthContext)   // set React auth state directly
  const [error, setError]   = useState(null)
  const [status, setStatus] = useState('Verifying your session…')
  const attempted = useRef(false)       // guard against StrictMode double-invoke

  useEffect(() => {
    // Wait for AuthContext to finish its own initialization before we act
    if (loading) return

    if (attempted.current) return
    attempted.current = true

    const token = searchParams.get('token')

    if (!token) {
      setError('No SSO token found in the URL. Please log in again from SDMS.')
      return
    }

    // If student already has a valid CRT session (logged in directly before),
    // skip the exchange entirely and land them straight on the dashboard.
    if (user && user.role === 'student') {
      setStatus('Session found. Redirecting to dashboard…')
      navigate('/student', { replace: true })
      return
    }

    const exchange = async () => {
      try {
        setStatus('Authenticating with SDMS credentials…')

        const response = await axios.post(
          `${API_BASE}/auth/sso-exchange`,
          { token },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const { data: body } = response

        if (!body.success) {
          throw new Error(body.message || 'SSO exchange failed')
        }

        const { access_token, refresh_token, user } = body.data

        // 1. Persist tokens to localStorage (same as normal login)
        localStorage.setItem('access_token',  access_token)
        localStorage.setItem('refresh_token', refresh_token)
        localStorage.setItem('user',          JSON.stringify(user))

        // 2. Update AuthContext React state immediately so ProtectedRoute
        //    sees isAuthenticated=true before navigate() fires.
        //    Without this, ProtectedRoute bounces back to /login because
        //    the React state is still null even though localStorage is set.
        setUser(user)

        setStatus('Login successful! Redirecting to dashboard…')

        // Navigate — ProtectedRoute will now pass because user state is set
        navigate('/student', { replace: true })

      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          'SSO login failed. Please try again.'
        setError(msg)
      }
    }

    exchange()
  }, [searchParams, navigate, setUser, user, loading])

  // ── render ────────────────────────────────────────────────────────────────

  // Still waiting for AuthContext to hydrate from localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center bg-[#071C46] px-5 py-2.5 rounded-xl shadow-md mx-auto mb-6">
            <img
              src="/campo-logos/campo_logo_transparent_hq.png"
              alt="Campo Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="relative flex items-center justify-center w-14 h-14 mx-auto my-3">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
          <p className="mt-6 text-gray-600 text-sm font-medium">Checking session…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {/* error icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.293 4.293a1 1 0 011.414 0L21 13.586A2 2 0 0119.586 15H4.414A2 2 0 013 13.586L12.293 4.293z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">SSO Login Failed</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>

          <a
            href="/login"
            className="inline-block w-full py-3 px-4 rounded-lg text-white font-semibold
                       bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Go to Login Page
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center bg-[#071C46] px-5 py-2.5 rounded-xl shadow-md mx-auto mb-6">
          <img
            src="/campo-logos/campo_logo_transparent_hq.png"
            alt="Campo Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="relative flex items-center justify-center w-14 h-14 mx-auto my-3">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>

        <p className="mt-6 text-gray-600 text-sm font-medium">{status}</p>
        <p className="mt-1 text-gray-400 text-xs">You'll be redirected automatically.</p>
      </div>
    </div>
  )
}

export default SSOLogin
