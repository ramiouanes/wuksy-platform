'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Leaf, 
  Sparkles, 
  Heart,
  Shield,
  Mail,
  CheckCircle,
  X,
  Upload,
  Activity
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Thank you for subscribing!')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="WUKSY"
                width={200}
                height={60}
                className="h-24 w-auto"
                priority
              />
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed max-w-xl mx-auto">
              Transform your blood test confusion into a personalized wellness roadmap
            </p>

            {/* Coming Soon Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-neutral-800 tracking-tight">
                Coming{' '}
                <motion.span 
                  className="zen-text font-medium text-primary-600"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ display: 'inline-block' }}
                >
                  Soon
                </motion.span>
              </h1>
            </motion.div>

            {/* Email Subscription */}
            <div className="max-w-md mx-auto pt-4">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary-50 border border-primary-200 rounded-xl p-6"
                >
                  <CheckCircle className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-primary-800 mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-primary-700 text-sm">
                    {message}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email to be notified"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="w-full h-14 text-base text-center border-sage-500/30 focus:border-sage-600 focus:ring-sage-500/20"
                  />
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    isLoading={status === 'loading'}
                    className="w-full h-14"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Notify Me at Launch
                  </Button>
                  
                  {status === 'error' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-600 text-sm"
                    >
                      {message}
                    </motion.p>
                  )}
                  
                  <p className="text-neutral-500 text-xs">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>

            {/* Know More Link */}
            <button
              onClick={() => setShowModal(true)}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm underline"
            >
              Know More
            </button>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center gap-6 text-sm text-neutral-500 pt-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary-500" />
                <span className="hidden sm:inline">Preventive Wellness</span>
                <span className="sm:hidden">Wellness</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary-500" />
                <span className="hidden sm:inline">Science-Based</span>
                <span className="sm:hidden">Science</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>AI-Powered</span>
              </div>
            </div>

            {/* Admin Access */}
            <div className="pt-8">
              <a
                href="/admin/login"
                className="text-neutral-400 hover:text-primary-600 text-xs transition-colors"
              >
                Team Access
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Know More Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-full hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Content */}
              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <Image
                      src="/logo.svg"
                      alt="WUKSY"
                      width={200}
                      height={100}
                      className="h-12 w-auto"
                    />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-3">
                    What is <span className="zen-text font-medium">WUKSY</span>?
                  </h2>
                  <p className="text-lg text-neutral-600">
                    Your mindful companion for understanding blood test results
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <Upload className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 mb-1">Upload Your Results</h3>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        Simply share your blood test results in any format. Our system extracts and analyzes your biomarkers automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <Sparkles className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 mb-1">AI-Powered Analysis</h3>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        Our thoughtful AI reviews your biomarkers with care and precision, identifying patterns and potential concerns.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <Activity className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 mb-1">Personalized Insights</h3>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        Receive clear, actionable recommendations tailored to your unique wellness journey—no medical jargon.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <Heart className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 mb-1">Holistic Wellness</h3>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        Get supplement recommendations, lifestyle guidance, and resources to support your path to optimal health.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Philosophy */}
                <div className="bg-primary-50/50 rounded-xl p-6 mb-8">
                  <h3 className="font-medium text-neutral-800 mb-2 text-center">Our Philosophy</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed text-center">
                    We believe health insights should bring peace, not anxiety. WUKSY transforms complex medical data into calm, clear guidance—helping you find tranquility in your wellness journey.
                  </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Button
                    onClick={() => setShowModal(false)}
                    size="lg"
                    className="px-8"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Get Notified at Launch
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

