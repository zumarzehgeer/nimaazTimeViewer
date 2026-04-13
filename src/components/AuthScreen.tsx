import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { auth, db } from '../firebase'
import { LocationSearch } from './LocationSearch'
import type { LocationState, UserProfile, MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

type Mode = 'signin' | 'signup'

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'No internet connection. Please try again when online.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
}

function getErrorMessage(code: string): string {
  return AUTH_ERRORS[code] ?? 'Something went wrong. Please try again.'
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')

  // Sign-in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sign-up extra fields
  const [mosqueName, setMosqueName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState<LocationState | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setError(null)
    setEmail('')
    setPassword('')
    setMosqueName('')
    setPhone('')
    setLocation(null)
    setShowPassword(false)
  }

  const handleToggleMode = () => {
    reset()
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // onAuthStateChanged in useAuth will pick up the new user — no need to navigate manually
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!mosqueName.trim()) {
      setError('Please enter your mosque name.')
      return
    }
    if (!location) {
      setError('Please select your mosque location.')
      return
    }

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const { uid } = credential.user

      const profile: UserProfile = {
        uid,
        email: email.trim(),
        mosqueName: mosqueName.trim(),
        phoneNumber: phone.trim(),
        location,
        createdAt: Date.now(),
      }

      const initialSettings: MosqueSettings = {
        ...DEFAULT_SETTINGS,
        mosqueName: mosqueName.trim(),
        location,
      }

      // Write to localStorage immediately so useSettings has the right data
      // before onAuthStateChanged fires and triggers the main app render
      localStorage.setItem('nimaaz-settings', JSON.stringify(initialSettings))

      // Write profile and settings to Firestore in parallel.
      // If this fails, sign the user back out so they aren't left in a
      // half-created state (auth account exists but no Firestore record).
      try {
        await Promise.all([
          setDoc(doc(db, 'users', uid, 'profile', 'info'), profile),
          setDoc(doc(db, 'users', uid, 'config', 'mosque'), initialSettings),
        ])
      } catch (firestoreErr: unknown) {
        localStorage.removeItem('nimaaz-settings')
        await signOut(auth)
        throw firestoreErr
      }
      // onAuthStateChanged will now fire and App.tsx will render the main view
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕌</div>
          <h1 className="text-2xl font-bold text-white">Nimaaz Time Viewer</h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'signin' ? 'Sign in to your mosque account' : 'Create your mosque account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} noValidate>
            {/* Sign-up only fields */}
            {mode === 'signup' && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mosque Name
                  </label>
                  <input
                    type="text"
                    value={mosqueName}
                    onChange={(e) => setMosqueName(e.target.value)}
                    placeholder="e.g. Masjid Al-Nur"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mosque Location
                  </label>
                  <LocationSearch onSelect={setLocation} />
                  {location && (
                    <p className="text-xs text-green-600 mt-1 ml-1">{location.label}</p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mosque.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {/* Phone — sign-up only, optional */}
            {mode === 'signup' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Phone Number <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              {loading
                ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
                : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === 'signin' ? (
              <>
                New mosque?{' '}
                <button onClick={handleToggleMode} className="text-indigo-600 font-semibold hover:underline">
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={handleToggleMode} className="text-indigo-600 font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
