'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { signUp, signInWithProvider } from '@/lib/auth'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function SignUpPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDataConsentInfo, setShowDataConsentInfo] = useState(false)
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    dataConsent: false,
    researchConsent: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (!agreements.terms || !agreements.privacy || !agreements.dataConsent) {
      setError('Please accept the required terms and conditions')
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp(
        formData.email, 
        formData.password, 
        formData.name,
        agreements.dataConsent,
        agreements.researchConsent
      )
      
      // Check if email confirmation is required
      if (result.user && !result.session) {
        // Email confirmation is required
        router.push('/auth/signin?message=Please check your email to confirm your account')
      } else {
        // User is automatically signed in
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    setError('')

    try {
      await signInWithProvider(provider)
      // Redirect will be handled by the OAuth provider
    } catch (err: any) {
      setError(err.message || `An error occurred during ${provider} sign up`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
        className="max-w-md w-full"
      >
        <Card className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="WUKSY Logo"
                width={140}
                height={45}
                className="h-10 sm:h-12 w-auto"
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Join WUKSY Today
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Start your personalized health journey in minutes
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-neutral-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>AI-powered blood test analysis</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Personalized supplement protocols</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Evidence-based recommendations</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full py-3 text-sm sm:text-base"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="truncate">Continue with Google</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or create account</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
              placeholder="Enter your full name"
            />

            <Input
              label="Email Address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
              placeholder="your@email.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="absolute right-2 top-[1.875rem] text-neutral-400 hover:text-neutral-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute right-2 top-[1.875rem] text-neutral-400 hover:text-neutral-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Terms and Privacy */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements({ ...agreements, terms: e.target.checked })}
                  className="h-4 w-4 mt-1 min-w-[16px] text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-neutral-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-500 hover:text-primary-600 underline">
                    Terms of Service
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="privacy"
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
                  className="h-4 w-4 mt-1 min-w-[16px] text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                  required
                />
                <label htmlFor="privacy" className="ml-2 text-sm text-neutral-700">
                  I agree to the{' '}
                  <Link href="/privacy" className="text-primary-500 hover:text-primary-600 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="dataConsent"
                  type="checkbox"
                  checked={agreements.dataConsent}
                  onChange={(e) => setAgreements({ ...agreements, dataConsent: e.target.checked })}
                  className="h-4 w-4 mt-1 min-w-[16px] text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                  required
                />
                <label htmlFor="dataConsent" className="ml-2 text-sm text-neutral-700">
                  I consent to health data processing{' '}
                  <button 
                    type="button"
                    className="text-primary-500 hover:text-primary-600"
                    onClick={() => setShowDataConsentInfo(!showDataConsentInfo)}
                    aria-label="Show data consent details"
                  >
                    (details)
                  </button>
                </label>
              </div>
              
              {showDataConsentInfo && (
                <div className="ml-6 text-xs text-neutral-600 bg-neutral-50 p-3 rounded">
                  Your health data will be processed for personalized analysis. 
                  You can delete your data at any time.
                </div>
              )}

              <div className="flex items-start">
                <input
                  id="researchConsent"
                  type="checkbox"
                  checked={agreements.researchConsent}
                  onChange={(e) => setAgreements({ ...agreements, researchConsent: e.target.checked })}
                  className="h-4 w-4 mt-1 min-w-[16px] text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="researchConsent" className="ml-2 text-sm text-neutral-700">
                  Anonymous data use for research (optional)
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary-500 hover:text-primary-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}