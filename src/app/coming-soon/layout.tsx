export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No Header or Footer for coming soon page - clean landing page
  return <>{children}</>
}

