import AdminBanner from '@/components/layout/AdminBanner'

export default function UploadLayout({
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

