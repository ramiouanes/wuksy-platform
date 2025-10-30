export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No Header or Footer for admin login page - clean login page
  return <>{children}</>
}

