import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, writeBatch } from 'firebase/firestore'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { auth, db } from '../firebase'
import { LocationSearch } from './LocationSearch'
import type { LocationState, UserProfile, MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { settingsStorageKey } from '../hooks/useSettings'

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
  'setup/rolled-back': 'Setup could not be saved. No account was kept; please try again.',
  'setup/account-retained': 'Setup could not be confirmed. Your account may exist; sign in with this email instead of creating it again.',
}

function getErrorMessage(code: string): string {
  return AUTH_ERRORS[code] ?? 'Something went wrong. Please try again.'
}

export function AuthScreen({ onSignupPendingChange }: { onSignupPendingChange: (pending: boolean) => void }) {
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
    onSignupPendingChange(true)
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

      // Firestore commits both documents or neither. Keep the signup screen
      // mounted until setup finishes, even though Auth has already signed in.
      try {
        const batch = writeBatch(db)
        batch.set(doc(db, 'users', uid, 'profile', 'info'), profile)
        batch.set(doc(db, 'users', uid, 'config', 'mosque'), initialSettings)
        await batch.commit()
      } catch (firestoreErr: unknown) {
        try { localStorage.removeItem(settingsStorageKey(uid)) } catch { /* optional local cache */ }
        const code = (firestoreErr as { code?: string }).code ?? ''
        let rolledBack = false
        // Only a definitive rejection permits deleting this newly created user.
        // A lost acknowledgment must not delete an account whose batch may exist.
        if (['permission-denied', 'unauthenticated', 'invalid-argument'].includes(code)) {
          try { await deleteUser(credential.user); rolledBack = true } catch { /* retain a recoverable account */ }
        }
        await signOut(auth)
        throw { code: rolledBack ? 'setup/rolled-back' : 'setup/account-retained' }
      }
      // Local cache is optional; a successful cloud setup must not be rolled back
      // just because browser storage is full or disabled.
      try { localStorage.setItem(settingsStorageKey(uid), JSON.stringify(initialSettings)) } catch { /* cloud is authoritative */ }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getErrorMessage(code))
    } finally {
      setLoading(false)
      onSignupPendingChange(false)
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
          <a href="?demo=1" className="inline-block mt-4 text-sm text-teal-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            Explore the guest demo
          </a>
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
                <button disabled={loading} onClick={handleToggleMode} className="text-indigo-600 font-semibold hover:underline">
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button disabled={loading} onClick={handleToggleMode} className="text-indigo-600 font-semibold hover:underline">
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
