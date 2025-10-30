import AdminBanner from '@/components/layout/AdminBanner'

export default function AnalysisLayout({
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

