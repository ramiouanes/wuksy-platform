'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCart } from '@/contexts/CartContext'
import { Menu, X, LogOut, Sparkles, FlaskConical, ShoppingCart, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import CartDrawer from '@/components/cart/CartDrawer'

export default function Header() {
  const { user, loading, signOut, session } = useAuth()
  const { cartItemCount } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // For display: use session to determine if logged in (instant), user for details (delayed)
  // This prevents flash of logged-out state on reload
  // Show logged-in UI if: has session OR (loading and no explicit sign-out)
  const isAuthenticated = !!session || (loading && !isSigningOut)
  const displayUser = user // Use actual user, but isAuthenticated determines UI

  // Close menu when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setIsMenuOpen(false)
    }
  }, [isAuthenticated])

  // Reset signing out state when user changes (e.g., signs back in)
  useEffect(() => {
    if (user && isSigningOut) {
      setIsSigningOut(false)
    }
  }, [user, isSigningOut])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:justify-start">
          {/* Logo - Centered on mobile */}
          <Link 
            href={isAuthenticated ? "/dashboard" : "/"} 
            className="flex items-center space-x-3 md:flex-none absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0"
          >
            <Image
              src="/logo.svg"
              alt="WUKSY Logo"
              width={140}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8 md:ml-auto">
              <Link 
                href="/how-it-works" 
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                aria-current={pathname === '/how-it-works' ? 'page' : undefined}
              >
                How It Works
              </Link>
              <Link 
                href="/biomarkers" 
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                aria-current={pathname === '/biomarkers' ? 'page' : undefined}
              >
                Biomarkers
              </Link>
              <Link 
                href="/supplements" 
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                aria-current={pathname === '/supplements' ? 'page' : undefined}
              >
                Supplements
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                    aria-current={pathname === '/dashboard' ? 'page' : undefined}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/documents" 
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                    aria-current={pathname === '/documents' ? 'page' : undefined}
                  >
                    Documents
                  </Link>
                  <Link 
                    href="/orders" 
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                    aria-current={pathname === '/orders' ? 'page' : undefined}
                  >
                    My Orders
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-3 md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Cart Icon */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 rounded-lg hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
                    aria-label="View cart"
                  >
                    <ShoppingCart className="h-5 w-5 text-primary-600" />
                    {cartItemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </motion.span>
                    )}
                  </button>
                  
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      Profile
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      setIsSigningOut(true)
                      await signOut()
                      setTimeout(() => {
                        router.push('/')
                        setIsSigningOut(false)
                      }, 100)
                    } catch (error) {
                      console.error('Error signing out:', error)
                      setIsSigningOut(false)
                    }
                  }}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

          {/* Mobile: Menu button */}
          <button
            className="md:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors touch-target ml-auto relative z-[60]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer menu (slides from right) - Outside header for full-page positioning */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-[60] overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <Image
                    src="/logo.svg"
                    alt="WUKSY"
                    width={120}
                    height={40}
                    className="h-8 w-auto"
                  />
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-neutral-600" />
                  </button>
                </div>
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-800">{displayUser?.email || 'User'}</p>
                    <p className="text-xs text-neutral-500">Wellness Journey</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-800">Welcome to WUKSY</p>
                    <p className="text-xs text-neutral-500">Your wellness companion</p>
                  </div>
                )}
              </div>

              {/* Drawer Content */}
              <div className="flex flex-col h-[calc(100%-180px)]">
                {isAuthenticated ? (
                  <>
                    {/* Menu Items for logged in users */}
                    <div className="p-6 space-y-1">
                      <Link
                        href="/how-it-works"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                        onClick={() => setIsMenuOpen(false)}
                        aria-current={pathname === '/how-it-works' ? 'page' : undefined}
                      >
                        <Sparkles className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                        <span className="font-medium">How It Works</span>
                      </Link>
                      
                      <Link
                        href="/supplements"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                        onClick={() => setIsMenuOpen(false)}
                        aria-current={pathname === '/supplements' ? 'page' : undefined}
                      >
                        <FlaskConical className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                        <span className="font-medium">Supplements</span>
                      </Link>
                      
                      <Link
                        href="/orders"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                        onClick={() => setIsMenuOpen(false)}
                        aria-current={pathname === '/orders' ? 'page' : undefined}
                      >
                        <Package className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                        <span className="font-medium">My Orders</span>
                      </Link>
                    </div>

                    {/* Sign Out at bottom for logged in */}
                    <div className="mt-auto p-6 border-t border-neutral-100 bg-neutral-50">
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          try {
                            setIsSigningOut(true)
                            await signOut()
                            setIsMenuOpen(false)
                            setTimeout(() => {
                              router.push('/')
                              setIsSigningOut(false)
                            }, 100)
                          } catch (error) {
                            console.error('Error signing out:', error)
                            setIsSigningOut(false)
                          }
                        }} 
                        className="w-full justify-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      <p className="text-xs text-center text-neutral-500 mt-4">
                        Your personalized wellness companion
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Auth buttons at top for logged out users */}
                    <div className="p-6">
                      <div className="bg-gradient-to-br from-primary-50 to-sage-50 rounded-2xl p-6 mb-6">
                        <h3 className="text-lg font-medium text-neutral-800 mb-2">
                          Start Your Wellness Journey
                        </h3>
                        <p className="text-sm text-neutral-600 mb-6">
                          Transform your blood test confusion into personalized wellness insights
                        </p>
                        <div className="flex flex-col gap-3">
                          <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="primary" className="w-full justify-center h-12 text-base font-medium">
                              Get Started Free
                            </Button>
                          </Link>
                          <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-center h-12 text-base">
                              Sign In
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Secondary links */}
                      <div className="space-y-1">
                        <Link
                          href="/how-it-works"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 transition-colors group"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={pathname === '/how-it-works' ? 'page' : undefined}
                        >
                          <Sparkles className="h-5 w-5 text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                          <span className="text-sm">How It Works</span>
                        </Link>
                        
                        <Link
                          href="/supplements"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 transition-colors group"
                          onClick={() => setIsMenuOpen(false)}
                          aria-current={pathname === '/supplements' ? 'page' : undefined}
                        >
                          <FlaskConical className="h-5 w-5 text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                          <span className="text-sm">Supplements</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}