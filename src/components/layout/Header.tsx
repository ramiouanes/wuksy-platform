'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { Menu, X, User, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="WUKSY Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/how-it-works" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm">
              How It Works
            </Link>
            <Link href="/biomarkers" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm">
              Biomarkers
            </Link>
            <Link href="/supplements" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm">
              Supplements
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm">
                  Dashboard
                </Link>
                <Link href="/documents" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm">
                  Documents
                </Link>
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
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

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/50 py-4 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              <Link
                href="/how-it-works"
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/biomarkers"
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Biomarkers
              </Link>
              <Link
                href="/supplements"
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Supplements
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/documents"
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Documents
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-neutral-200/50">
                {user ? (
                  <div className="flex flex-col space-y-3">
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={signOut} className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}