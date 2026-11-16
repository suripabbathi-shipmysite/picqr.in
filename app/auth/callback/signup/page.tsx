'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: { full_name: fullName, country: 'India' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        if (data.session) {
          router.push('/dashboard')
        } else {
          setError('Account created! Check your email to confirm, then Login.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-center">Create Your Account</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Start your first event free - No card required.</p>

        <button onClick={handleGoogle} className="w-full border rounded-lg py-2 mb-4">Sign Up with Google</button>
        <div className="text-center text-xs text-gray-400 mb-4">OR</div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Pabbathi Suresh" className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Email ID</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@gmail.com" className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Country (Auto Detected - Locked)</label>
            <input value="India" disabled className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">📍 Detected: India - Locked to your location.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Create Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full border rounded-lg px-3 py-2 mt-1" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-sm text-purple-600">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white py-3 rounded-lg font-semibold">
            {loading ? 'Creating...' : 'Create Free Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">Already have an account? <a href="/auth/login" className="text-purple-600 font-semibold">Login</a></p>
      </div>
    </div>
  )
}