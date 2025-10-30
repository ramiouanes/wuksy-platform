'use client'

import { Shield, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminBanner() {
  const { logout } = useAdminAuth()

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Admin Mode</span>
            <span className="text-amber-600">•</span>
            <span className="text-amber-700">
              This site is currently only accessible to administrators
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-8"
          >
            <LogOut className="h-3 w-3 mr-2" />
            Admin Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

