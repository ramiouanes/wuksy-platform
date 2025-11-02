'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ChevronDown } from 'lucide-react'

export default function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const toggleSection = (section: string) => {
    if (isMobile) {
      setExpandedSection(expandedSection === section ? null : section)
    }
  }
  
  const isSectionExpanded = (section: string) => {
    return !isMobile || expandedSection === section
  }
  
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - Always visible */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="WUKSY Logo"
                width={140}
                height={45}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm sm:text-base text-neutral-300">
              Transform your blood test confusion into a personalized wellness roadmap.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">support@wuksy.com</span>
              </div>
            </div>
          </div>

          {/* Product - Collapsible on mobile */}
          <div>
            <button
              onClick={() => toggleSection('product')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-left"
              aria-expanded={isSectionExpanded('product')}
              aria-label={isMobile ? (isSectionExpanded('product') ? 'Collapse Product section' : 'Expand Product section') : undefined}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-0 md:mb-4">Product</h3>
              <ChevronDown 
                className={`h-4 w-4 md:hidden transition-transform ${
                  isSectionExpanded('product') ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            
            <ul className={`space-y-2 overflow-hidden transition-all duration-300 ${
              isSectionExpanded('product')
                ? 'mt-4 max-h-96 opacity-100' 
                : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100 md:mt-4'
            }`}>
              <li>
                <Link href="/how-it-works" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/biomarkers" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Biomarkers Guide
                </Link>
              </li>
              <li>
                <Link href="/supplements" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Supplements
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources - Collapsible on mobile */}
          <div>
            <button
              onClick={() => toggleSection('resources')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-left"
              aria-expanded={isSectionExpanded('resources')}
              aria-label={isMobile ? (isSectionExpanded('resources') ? 'Collapse Resources section' : 'Expand Resources section') : undefined}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-0 md:mb-4">Resources</h3>
              <ChevronDown 
                className={`h-4 w-4 md:hidden transition-transform ${
                  isSectionExpanded('resources') ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            
            <ul className={`space-y-2 overflow-hidden transition-all duration-300 ${
              isSectionExpanded('resources')
                ? 'mt-4 max-h-96 opacity-100' 
                : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100 md:mt-4'
            }`}>
              <li>
                <Link href="/blog" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Health Blog
                </Link>
              </li>
              <li>
                <Link href="/research" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Scientific Research
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - Collapsible on mobile */}
          <div>
            <button
              onClick={() => toggleSection('legal')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-left"
              aria-expanded={isSectionExpanded('legal')}
              aria-label={isMobile ? (isSectionExpanded('legal') ? 'Collapse Legal section' : 'Expand Legal section') : undefined}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-0 md:mb-4">Legal</h3>
              <ChevronDown 
                className={`h-4 w-4 md:hidden transition-transform ${
                  isSectionExpanded('legal') ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            
            <ul className={`space-y-2 overflow-hidden transition-all duration-300 ${
              isSectionExpanded('legal')
                ? 'mt-4 max-h-96 opacity-100' 
                : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100 md:mt-4'
            }`}>
              <li>
                <Link href="/privacy" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/medical-disclaimer" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  Medical Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-sm text-neutral-300 hover:text-white transition-colors">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright - Simplified on mobile */}
        <div className="border-t border-neutral-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <div className="text-neutral-300 text-xs sm:text-sm space-y-2">
            <p className="hidden sm:block mb-2">
              <strong>Medical Disclaimer:</strong> WUKSY provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease. 
              Always consult with qualified healthcare professionals before making health decisions.
            </p>
            <p>
              © {new Date().getFullYear()} WUKSY. All rights reserved.
            </p>
            <button 
              onClick={() => toggleSection('disclaimer')}
              className="sm:hidden text-primary-400 hover:text-primary-300 text-xs underline"
              aria-expanded={expandedSection === 'disclaimer'}
            >
              {expandedSection === 'disclaimer' ? 'Hide' : 'Show'} Medical Disclaimer
            </button>
            {expandedSection === 'disclaimer' && (
              <p className="text-xs mt-2 px-4">
                <strong>Medical Disclaimer:</strong> WUKSY provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease. 
                Always consult with qualified healthcare professionals before making health decisions.
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}