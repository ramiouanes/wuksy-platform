import AdminBanner from '@/components/layout/AdminBanner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminBanner />
      {children}
    </>
  )
}

