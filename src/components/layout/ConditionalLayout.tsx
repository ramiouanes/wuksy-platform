'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Routes that should NOT have header/footer
  const cleanLayoutRoutes = [
    '/coming-soon',
    '/admin/login',
  ]

  const shouldShowHeaderFooter = !cleanLayoutRoutes.some(route => 
    pathname?.startsWith(route)
  )

  if (shouldShowHeaderFooter) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  // Clean layout for coming soon and admin login
  return <>{children}</>
}

