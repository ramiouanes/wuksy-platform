import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="WUKSY Logo"
                width={140}
                height={45}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-neutral-300">
              Transform your blood test confusion into a personalized wellness roadmap in minutes, not months.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <Mail className="h-4 w-4" />
                <span>support@wuksy.com</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-neutral-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/biomarkers" className="text-neutral-300 hover:text-white transition-colors">
                  Biomarkers Guide
                </Link>
              </li>
              <li>
                <Link href="/supplements" className="text-neutral-300 hover:text-white transition-colors">
                  Supplements
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-neutral-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-neutral-300 hover:text-white transition-colors">
                  Health Blog
                </Link>
              </li>
              <li>
                <Link href="/research" className="text-neutral-300 hover:text-white transition-colors">
                  Scientific Research
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-neutral-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-neutral-300 hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-neutral-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/medical-disclaimer" className="text-neutral-300 hover:text-white transition-colors">
                  Medical Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-neutral-300 hover:text-white transition-colors">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-8 text-center">
          <div className="text-neutral-300 text-sm">
            <p className="mb-2">
              <strong>Medical Disclaimer:</strong> WUKSY provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease. 
              Always consult with qualified healthcare professionals before making health decisions.
            </p>
            <p>
              © {new Date().getFullYear()} WUKSY. All rights reserved. | Made with ❤️ for better health.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}