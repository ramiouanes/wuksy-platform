import AdminBanner from '@/components/layout/AdminBanner'

export default function AppLayout({
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

