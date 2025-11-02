'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  Leaf, 
  Clock,
  Plus,
  ArrowRight,
  Activity,
  BookOpen,
  ShoppingCart,
  Heart,
  ChevronDown
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { createClient } from '@supabase/supabase-js'

interface Analysis {
  id: string
  created_at: string
  health_category: 'poor' | 'fair' | 'good' | 'excellent'
  overall_health_score: number
  biomarker_count?: number
  recommendations_count?: number
}

interface DashboardStats {
  totalAnalyses: number
  averageScore: number
  improvementTrend: string
  lastAnalysis: string
  totalDocuments: number
  pendingDocuments: number
  documentsWithBiomarkers: number
}

export default function DashboardPage() {
  const { user, loading, session } = useAuth()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSupport, setShowSupport] = useState(false)
  
  // Mobile responsiveness hooks
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && session) {
      fetchDashboardData()
    }
  }, [user, session])

  const fetchDashboardData = async () => {
    if (!session?.access_token) return

    try {
      // Create Supabase client with user's token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      })

      // Fetch user's analyses
      const { data: analysesData, error: analysesError } = await userSupabase
        .from('health_analyses')
        .select(`
          id,
          created_at,
          health_category,
          overall_health_score,
          biomarker_insights
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError)
      } else {
        // Add biomarker count to each analysis
        const analysesWithCounts = analysesData?.map(analysis => ({
          ...analysis,
          biomarker_count: Array.isArray(analysis.biomarker_insights) ? analysis.biomarker_insights.length : 0,
          recommendations_count: 8 // Could be calculated from recommendations_summary
        })) || []
        
        setAnalyses(analysesWithCounts)
      }

      // Fetch documents with biomarker counts for additional stats
      const { data: documentsData, error: documentsError } = await userSupabase
        .from('documents')
        .select(`
          id, 
          status, 
          uploaded_at, 
          filename,
          biomarker_readings!inner(id)
        `)
        .eq('user_id', user!.id)

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
      }

      // Calculate stats
      if (analysesData && documentsData) {
        const totalAnalyses = analysesData.length
        const averageScore = totalAnalyses > 0 
          ? Math.round(analysesData.reduce((sum, analysis) => sum + (analysis.overall_health_score || 0), 0) / totalAnalyses)
          : 0

        // Calculate improvement trend (comparing last two analyses)
        let improvementTrend = '0%'
        if (analysesData.length >= 2) {
          const latest = analysesData[0].overall_health_score || 0
          const previous = analysesData[1].overall_health_score || 0
          const change = latest - previous
          const percentage = previous > 0 ? Math.round((change / previous) * 100) : 0
          improvementTrend = `${percentage >= 0 ? '+' : ''}${percentage}%`
        }

        // Calculate last analysis time
        let lastAnalysis = 'Never'
        if (analysesData.length > 0) {
          const lastDate = new Date(analysesData[0].created_at)
          const now = new Date()
          const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff === 0) {
            lastAnalysis = 'Today'
          } else if (daysDiff === 1) {
            lastAnalysis = '1 day ago'
          } else if (daysDiff < 30) {
            lastAnalysis = `${daysDiff} days ago`
          } else {
            const monthsDiff = Math.floor(daysDiff / 30)
            lastAnalysis = monthsDiff === 1 ? '1 month ago' : `${monthsDiff} months ago`
          }
        }

        const totalDocuments = documentsData.length
        const pendingDocuments = documentsData.filter(doc => doc.status === 'processing').length
        const documentsWithBiomarkers = documentsData.filter(doc => doc.biomarker_readings && doc.biomarker_readings.length > 0).length

        setStats({
          totalAnalyses,
          averageScore,
          improvementTrend,
          lastAnalysis,
          totalDocuments,
          pendingDocuments,
          documentsWithBiomarkers
        })
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Leaf className="h-8 w-8 text-primary-500" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getHealthCategoryColor = (category: string) => {
    switch (category) {
      case 'poor': return 'health-score-poor'
      case 'fair': return 'health-score-fair'
      case 'good': return 'health-score-good'
      case 'excellent': return 'health-score-excellent'
      default: return 'health-score-fair'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-2xl sm:text-3xl font-light text-neutral-800 mb-3">
            Welcome back, {(user as any).user_metadata?.full_name || user.email?.split('@')[0]} 🌱
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Continue your peaceful journey towards optimal health
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          <Link href="/upload">
            <Card className="p-6 card-hover group cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-primary-50 p-3 rounded-full group-hover:bg-primary-100 transition-colors">
                  <Upload className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-800">Upload New Test</h3>
                  <p className="text-sm text-neutral-600">Add your latest results</p>
                </div>
                <Plus className="h-4 w-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </Card>
          </Link>

          <Link href="/biomarkers">
            <Card className="p-6 card-hover group cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-stone-50 p-3 rounded-full group-hover:bg-stone-100 transition-colors">
                  <BookOpen className="h-5 w-5 text-stone-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-800">Learn More</h3>
                  <p className="text-sm text-neutral-600">Understand your body</p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-stone-500 transition-colors" />
              </div>
            </Card>
          </Link>

          <Card className="p-6 card-hover group cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-sage-50 p-3 rounded-full group-hover:bg-primary-50 transition-colors">
                <Heart className="h-5 w-5 text-sage-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-neutral-800">Wellness Plan</h3>
                <p className="text-sm text-neutral-600">Your personalized path</p>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-sage-500 transition-colors" />
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Overview */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-medium text-neutral-800">Health Overview</h2>
                  {stats && stats.improvementTrend !== '0%' && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-primary-600">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{stats.improvementTrend} this period</span>
                      <span className="sm:hidden">{stats.improvementTrend}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-light zen-text mb-2">
                      {stats?.averageScore || 0}
                    </div>
                    <div className="text-sm text-neutral-600">Wellness Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-light text-stone-600 mb-2">
                      {stats?.totalAnalyses || 0}
                    </div>
                    <div className="text-sm text-neutral-600">Analyses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-light text-primary-500 mb-2">
                      {analyses.length > 0 ? analyses[0].biomarker_count || 0 : 0}
                    </div>
                    <div className="text-sm text-neutral-600">Biomarkers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-light text-sage-600 mb-2">
                      {stats?.documentsWithBiomarkers || 0}
                    </div>
                    <div className="text-sm text-neutral-600">Documents</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Documents & Analyses */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
            >
              <Card className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-medium text-neutral-800">Recent Activity</h2>
                  <div className="flex space-x-2">
                    <Link href="/documents">
                      <Button variant="ghost" size="sm">
                        <span className="hidden sm:inline">View Documents</span>
                        <span className="sm:hidden">Docs</span>
                        <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    {analyses.length > 3 && (
                      <Button variant="ghost" size="sm" className="hidden md:flex">
                        View All Analyses
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/analysis/${analysis.id}`}
                      className="flex items-center justify-between p-6 bg-neutral-50/50 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-50 p-3 rounded-lg">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">
                            Analysis #{analysis.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {new Date(analysis.created_at).toLocaleDateString()} • {analysis.biomarker_count || 0} biomarkers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthCategoryColor(analysis.health_category)}`}>
                            {analysis.health_category.toUpperCase()}
                          </div>
                          <div className="text-sm text-neutral-600 mt-1">
                            Score: {analysis.overall_health_score}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400" />
                      </div>
                    </Link>
                  ))}
                </div>

                {analyses.length === 0 && (
                  <div className="text-center py-16">
                    <div className="bg-primary-50 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                      <Activity className="h-8 w-8 text-primary-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-800 mb-3">
                      Begin Your Journey
                    </h3>
                    <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                      Upload your first blood test to start understanding your body&apos;s wisdom
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/upload">
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Blood Test
                        </Button>
                      </Link>
                      {stats?.totalDocuments && stats.totalDocuments > 0 && (
                        <Link href="/documents">
                          <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            View Documents ({stats.totalDocuments})
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Insight */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
            >
              <Card className="p-6 zen-gradient">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500/10 p-2 rounded-full flex-shrink-0">
                    <Leaf className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-800 mb-3">
                      Today&apos;s Insight
                    </h3>
                    <ExpandableText
                      text="Your body speaks in whispers through your biomarkers. Listen gently and respond with kindness."
                      maxLines={2}
                      className="text-sm text-neutral-600 mb-4 leading-relaxed"
                    />
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Reflect More
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
            >
              <Card className="p-6">
                <h3 className="font-medium text-neutral-800 mb-6">Journey Stats</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Last Analysis</span>
                    <span className="text-sm font-medium text-neutral-800">
                      {stats?.lastAnalysis || 'Never'}
                    </span>
                  </div>
                  {stats && stats.improvementTrend !== '0%' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Health Trend</span>
                      <span className="text-sm font-medium text-primary-600">
                        {stats.improvementTrend}
                      </span>
                    </div>
                  )}
                  {stats && stats.pendingDocuments > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Processing</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {stats.pendingDocuments} document{stats.pendingDocuments > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Next Check-in</span>
                    <span className="text-sm font-medium text-neutral-800">
                      In 3 months
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.6 }}
            >
              <Card className="p-6">
                <button
                  onClick={() => setShowSupport(!showSupport)}
                  className="w-full text-left flex items-center justify-between touch-target"
                  aria-expanded={showSupport}
                  aria-label={showSupport ? 'Collapse support section' : 'Expand support section'}
                >
                  <h3 className="font-medium text-neutral-800">Caring Support</h3>
                  {isMobile && (
                    <ChevronDown 
                      className={`h-4 w-4 text-neutral-400 transition-transform ${showSupport ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
                
                {(showSupport || !isMobile) && (
                  <>
                    <p className="text-sm text-neutral-600 mt-4 mb-6 leading-relaxed">
                      Questions about your journey? Our caring team is here to guide you 
                      with patience and understanding.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Get Support
                    </Button>
                  </>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}