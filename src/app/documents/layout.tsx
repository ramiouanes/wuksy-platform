import AdminBanner from '@/components/layout/AdminBanner'

export default function DocumentsLayout({
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

