import AdminBanner from '@/components/layout/AdminBanner'

export default function BiomarkersLayout({
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

