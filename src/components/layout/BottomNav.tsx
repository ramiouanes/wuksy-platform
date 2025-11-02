'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Upload, Activity, User } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show on desktop or if not authenticated
  if (!user) return null

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/documents',
      icon: FileText,
      label: 'Documents',
    },
    {
      href: '/upload',
      icon: Upload,
      label: 'Upload',
    },
    {
      href: '/biomarkers',
      icon: Activity,
      label: 'Biomarkers',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive
                  ? 'text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs ${isActive ? 'font-medium' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

