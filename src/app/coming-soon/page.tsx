'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Leaf, 
  Sparkles, 
  Heart,
  Mail,
  CheckCircle,
  Upload,
  Activity,
  ArrowDown
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function ComingSoonPage() {
  const prefersReducedMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Reset scroll indicator when modal opens
  useEffect(() => {
    if (showModal) {
      setShowScrollIndicator(true)
    }
  }, [showModal])

  // Hide scroll indicator when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (modalContentRef.current) {
        const { scrollTop } = modalContentRef.current
        if (scrollTop > 50) {
          setShowScrollIndicator(false)
        }
      }
    }

    const modalElement = modalContentRef.current
    if (modalElement) {
      modalElement.addEventListener('scroll', handleScroll)
      return () => modalElement.removeEventListener('scroll', handleScroll)
    }
  }, [showModal])

  const scrollToSubscription = () => {
    if (modalContentRef.current) {
      const modalElement = modalContentRef.current
      
      // Scroll to the bottom of the modal
      modalElement.scrollTo({
        top: modalElement.scrollHeight,
        behavior: 'smooth'
      })
      
      setShowScrollIndicator(false)
    }
  }

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
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
            className="space-y-8"
          >
            {/* Logo - Responsive sizing */}
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="WUKSY"
                width={200}
                height={60}
                className="h-16 sm:h-20 md:h-24 w-auto"
                priority
              />
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed max-w-xl mx-auto">
              Transform your blood test confusion into a personalized wellness roadmap
            </p>

            {/* Coming Soon Badge */}
            <motion.div 
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-neutral-800 tracking-tight">
                Coming{' '}
                <motion.span 
                  className="zen-text font-medium text-primary-600"
                  animate={prefersReducedMotion ? {} : { 
                    scale: [1, 1.05, 1],
                  }}
                  transition={prefersReducedMotion ? {} : { 
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

            {/* Learn More Button */}
            <div className="max-w-md mx-auto pt-2">
              <motion.button
                onClick={() => setShowModal(true)}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? {} : { 
                  opacity: 1, 
                  y: 0,
                  boxShadow: [
                    "0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)",
                    "0 12px 24px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.2)",
                    "0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)"
                  ]
                }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.5 },
                  y: { duration: 0.6, delay: 0.5 },
                  boxShadow: { 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.15)"
                }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-14 flex items-center justify-center px-8 text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-lg font-medium transition-colors duration-200 text-lg relative overflow-hidden group"
              >
                {/* Shimmer effect - Enhanced with best practices */}
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, transparent 30%, rgba(255, 255, 255, 0.25) 50%, transparent 70%, transparent 100%)',
                  }}
                  animate={prefersReducedMotion ? {} : {
                    translateX: ['-100%', '250%'],
                  }}
                  transition={prefersReducedMotion ? {} : {
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth, natural motion
                  }}
                />
                <span className="relative z-10">What is Wuksy?</span>
              </motion.button>
            </div>

            {/* Email Subscription */}
            <div className="max-w-md mx-auto pt-2">
              {status === 'success' ? (
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                  className="bg-primary-50 border border-primary-200 rounded-xl p-6"
                >
                  <CheckCircle className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-primary-800 mb-2">
                    You&apos;re on the list!
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
                      initial={prefersReducedMotion ? {} : { opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1 }}
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

      {/* Know More Modal - Using ResponsiveModal Component */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="What is WUKSY?"
        contentRef={modalContentRef}
      >
        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div 
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10"
            >
              <motion.button
                onClick={scrollToSubscription}
                type="button"
                className="pointer-events-auto flex items-center justify-center px-2 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-primary-200 text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all"
                aria-label="Scroll to bottom"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={prefersReducedMotion ? {} : {
                    y: [0, 3, 0],
                  }}
                  transition={prefersReducedMotion ? {} : {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ArrowDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="WUKSY"
              width={200}
              height={100}
              className="h-10 sm:h-12 w-auto"
            />
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-600 text-center">
            Your mindful companion for understanding blood test results
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1 text-sm sm:text-base">Upload Your Results</h3>
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
                  Simply share your blood test results in any format. Our system extracts and analyzes your biomarkers automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1 text-sm sm:text-base">AI-Powered Analysis</h3>
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
                  Our thoughtful AI reviews your biomarkers with care and precision, identifying patterns and potential concerns.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1 text-sm sm:text-base">Personalized Insights</h3>
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
                  Receive clear, actionable recommendations tailored to your unique wellness journey—no medical jargon.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1 text-sm sm:text-base">Holistic Wellness</h3>
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
                  Get supplement recommendations, lifestyle guidance, and resources to support your path to optimal health.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="bg-primary-50/50 rounded-xl p-4 sm:p-6">
            <h3 className="font-medium text-neutral-800 mb-2 text-center text-sm sm:text-base">
              Our Philosophy
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed text-center">
              We believe health insights should bring peace, not anxiety. WUKSY transforms complex medical data into calm, clear guidance—helping you find tranquility in your wellness journey.
            </p>
          </div>

          {/* Email Subscription in Modal */}
          <div className="border-t border-neutral-200 pt-6 sm:pt-8 mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-medium text-neutral-800 mb-4 text-center">
              Be the First to Know
            </h3>
            {status === 'success' ? (
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                className="bg-primary-50 border border-primary-200 rounded-xl p-6"
              >
                <CheckCircle className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-primary-800 mb-2 text-center">
                  You&apos;re on the list!
                </h3>
                <p className="text-primary-700 text-sm text-center">
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
                    initial={prefersReducedMotion ? {} : { opacity: 0 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1 }}
                    className="text-red-600 text-sm text-center"
                  >
                    {message}
                  </motion.p>
                )}
                
                <p className="text-neutral-500 text-xs text-center">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </ResponsiveModal>
    </>
  )
}

