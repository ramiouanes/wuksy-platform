import { redirect } from 'next/navigation'

// Redirect root to Coming Soon page
export default function RootPage() {
  redirect('/coming-soon')
}