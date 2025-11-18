'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Download,
  Share2,
  Pill,
  Activity,
  Heart,
  Brain,
  Leaf,
  ArrowLeft,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Target,
  Utensils,
  Dumbbell,
  Moon,
  Zap,
  Users,
  Bell,
  Shield,
  Repeat
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ExpandableText } from '@/components/ui/ExpandableText'
import CartButton from '@/components/cart/CartButton'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { HealthAnalysis } from '@/lib/supabase'
import { formatProcessingTime } from '@/lib/utils'

interface AnalysisPageProps {
  params: Promise<{ id: string }>
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { user, session } = useAuth()
  const router = useRouter()
  const breakpoint = useBreakpoint()
  const prefersReducedMotion = useReducedMotion()
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string>('')
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview')
  
  // Lifestyle sub-tab state
  const [activeLifestyleTab, setActiveLifestyleTab] = useState('all')
  
  // Biomarker filter tab state
  const [activeBiomarkerTab, setActiveBiomarkerTab] = useState('priority')
  
  // Collapse states for details within sections
  const [expandedDetails, setExpandedDetails] = useState<{
    biomarkerDetails: Record<string | number, boolean>
    supplementDetails: boolean
    lifestyleDetails: boolean
    lifestyleCards: Record<string, boolean>
  }>({
    biomarkerDetails: {},
    supplementDetails: false,
    lifestyleDetails: false,
    lifestyleCards: {}
  })

  // Supplement priority tab state
  const [activeSupplementTab, setActiveSupplementTab] = useState('essential')

  // Recommendations data (fetched from API routes)
  const [supplements, setSupplements] = useState<any[]>([])
  const [lifestyle, setLifestyle] = useState<any[]>([])
  const [diet, setDiet] = useState<any[]>([])
  const [workout, setWorkout] = useState<any[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // Track if analysis has been loaded for this analysisId to prevent unnecessary re-fetches
  const loadedAnalysisIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Resolve the params promise
    const resolveParams = async () => {
      const resolvedParams = await params
      setAnalysisId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId || !session?.access_token) return
      
      // Only fetch if we haven't loaded this specific analysis yet
      if (loadedAnalysisIdRef.current === analysisId) {
        return
      }
      
      loadedAnalysisIdRef.current = analysisId
      
      try {
        const response = await fetch(`/api/analysis/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch analysis')
        }
        const data = await response.json()
        setAnalysis(data.analysis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Reset on error to allow retry
        loadedAnalysisIdRef.current = null
      } finally {
        setLoading(false)
      }
    }

    if (user && analysisId && session) {
      fetchAnalysis()
    }
  }, [analysisId, user, session])

  // Track if recommendations have been loaded for this analysisId
  const loadedRecommendationsIdRef = useRef<string | null>(null)

  // Fetch recommendations from API routes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!analysisId || !session?.access_token || !analysis || analysis.status !== 'completed') return
      
      // Only fetch if we haven't loaded recommendations for this analysis yet
      if (loadedRecommendationsIdRef.current === analysisId) {
        return
      }
      
      loadedRecommendationsIdRef.current = analysisId
      
      setLoadingRecommendations(true)
      try {
        // Fetch supplements
        const supplementsRes = await fetch(`/api/analysis/${analysisId}/supplements`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (supplementsRes.ok) {
          const supplementsData = await supplementsRes.json()
          setSupplements(supplementsData.supplements || [])
        }

        // Fetch lifestyle
        const lifestyleRes = await fetch(`/api/analysis/${analysisId}/lifestyle`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (lifestyleRes.ok) {
          const lifestyleData = await lifestyleRes.json()
          setLifestyle(lifestyleData.lifestyle || [])
        }

        // Fetch diet
        const dietRes = await fetch(`/api/analysis/${analysisId}/diet`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (dietRes.ok) {
          const dietData = await dietRes.json()
          setDiet(dietData.diet || [])
        }

        // Fetch workout
        const workoutRes = await fetch(`/api/analysis/${analysisId}/workout`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (workoutRes.ok) {
          const workoutData = await workoutRes.json()
          setWorkout(workoutData.workout || [])
        }
      } catch (err) {
        // Error fetching recommendations
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [analysisId, session, analysis])

  const toggleBiomarkerDetail = (index: string | number) => {
    setExpandedDetails(prev => ({
      ...prev,
      biomarkerDetails: {
        ...prev.biomarkerDetails,
        [index]: !prev.biomarkerDetails[index]
      }
    }))
  }

  const toggleSupplementDetails = () => {
    setExpandedDetails(prev => ({
      ...prev,
      supplementDetails: !prev.supplementDetails
    }))
  }

  const toggleLifestyleDetails = () => {
    setExpandedDetails(prev => ({
      ...prev,
      lifestyleDetails: !prev.lifestyleDetails
    }))
  }

  // Helper function to sort biomarkers by status priority (matching mobile app)
  const getStatusPriority = (status: string | null | undefined) => {
    if (!status) return 6
    switch (status.toLowerCase()) {
      case 'deficient': return 1
      case 'excess': return 2
      case 'concerning': return 3
      case 'suboptimal': return 4
      case 'optimal': return 5
      default: return 6
    }
  }

  // Helper function to get status display info
  const getStatusDisplayInfo = (status: string | null | undefined) => {
    switch (status) {
      case 'deficient': 
        return { 
          label: 'Deficient', 
          icon: AlertCircle, 
          bgColor: 'bg-red-100', // Darker red background
          borderColor: 'border-red-200', 
          textColor: 'text-neutral-700', // Neutral text
          iconColor: 'text-red-500'
        }
      case 'concerning': 
        return { 
          label: 'Concerning', 
          icon: AlertCircle, 
          bgColor: 'bg-orange-100', // Darker orange background
          borderColor: 'border-orange-200', 
          textColor: 'text-neutral-700', // Neutral text
          iconColor: 'text-orange-500'
        }
      case 'suboptimal': 
        return { 
          label: 'Suboptimal', 
          icon: TrendingUp, 
          bgColor: 'bg-yellow-100', // Darker yellow background
          borderColor: 'border-yellow-200', 
          textColor: 'text-neutral-700', // Neutral text
          iconColor: 'text-yellow-500'
        }
      case 'optimal': 
        return { 
          label: 'Optimal', 
          icon: CheckCircle, 
          bgColor: 'bg-green-100', // Darker green background
          borderColor: 'border-green-200', 
          textColor: 'text-neutral-700', // Neutral text
          iconColor: 'text-green-500'
        }
      default: 
        return { 
          label: 'Unknown', 
          icon: Info, 
          bgColor: 'bg-neutral-100', // Darker neutral background
          borderColor: 'border-neutral-200', 
          textColor: 'text-neutral-700',
          iconColor: 'text-neutral-500'
        }
    }
  }

  // Helper function to group biomarkers by status
  const groupBiomarkersByStatus = (biomarkers: any[]) => {
    const grouped = biomarkers.reduce((acc, biomarker) => {
      const status = biomarker.status || 'unknown'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(biomarker)
      return acc
    }, {} as Record<string, any[]>)

    // Sort biomarkers within each status group alphabetically
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a: any, b: any) => {
        const nameA = (a.biomarker_name || a.biomarker || '').toLowerCase()
        const nameB = (b.biomarker_name || b.biomarker || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
    })

    return grouped
  }

  const sortBiomarkersByStatus = (biomarkers: any[]) => {
    return [...biomarkers].sort((a, b) => {
      const priorityA = getStatusPriority(a.status)
      const priorityB = getStatusPriority(b.status)
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // If same priority, sort alphabetically by name
      const nameA = (a.biomarker_name || a.biomarker || '').toLowerCase()
      const nameB = (b.biomarker_name || b.biomarker || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }

  // Helper functions to get enhanced biomarker data
  const getBiomarkerDetails = (biomarkerName: string | undefined | null) => {
    if (!biomarkerName) return null
    const reading = analysis?.biomarker_readings?.find(
      (reading: any) => reading.biomarkers?.name?.toLowerCase() === biomarkerName.toLowerCase() ||
      reading.biomarker_name?.toLowerCase() === biomarkerName.toLowerCase()
    )
    return reading?.biomarkers || null
  }

  const getOptimalRanges = (biomarkerName: string | undefined | null) => {
    if (!biomarkerName) return []
    const reading = analysis?.biomarker_readings?.find(
      (reading: any) => reading.biomarkers?.name?.toLowerCase() === biomarkerName.toLowerCase() ||
      reading.biomarker_name?.toLowerCase() === biomarkerName.toLowerCase()
    )
    return reading?.optimal_ranges || []
  }

  const getScientificReferences = (biomarkerName: string | undefined | null) => {
    if (!biomarkerName) return []
    const reading = analysis?.biomarker_readings?.find(
      (reading: any) => reading.biomarkers?.name?.toLowerCase() === biomarkerName.toLowerCase() ||
      reading.biomarker_name?.toLowerCase() === biomarkerName.toLowerCase()
    )
    return reading?.scientific_references || []
  }

  const formatRangeValue = (value: number | null | undefined, unit: string) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value} ${unit}`
  }

  const getCurrentValueStatus = (currentValue: number, biomarkerName: string | undefined | null, unit: string) => {
    const optimalRanges = getOptimalRanges(biomarkerName)
    const biomarkerDetails = getBiomarkerDetails(biomarkerName)
    
    if (optimalRanges.length > 0) {
      const primaryRange = optimalRanges.find((r: any) => r.is_primary) || optimalRanges[0]
      if (currentValue >= primaryRange.optimal_min && currentValue <= primaryRange.optimal_max) {
        return { status: 'optimal', range: `${formatRangeValue(primaryRange.optimal_min, unit)} - ${formatRangeValue(primaryRange.optimal_max, unit)}`, type: 'Optimal' }
      }
    }
    
    if (biomarkerDetails && 
        biomarkerDetails.conventional_min !== null && 
        biomarkerDetails.conventional_max !== null &&
        biomarkerDetails.conventional_min !== undefined && 
        biomarkerDetails.conventional_max !== undefined) {
      if (currentValue >= biomarkerDetails.conventional_min && currentValue <= biomarkerDetails.conventional_max) {
        return { status: 'conventional', range: `${formatRangeValue(biomarkerDetails.conventional_min, unit)} - ${formatRangeValue(biomarkerDetails.conventional_max, unit)}`, type: 'Conventional' }
      }
    }
    
    return { status: 'unknown', range: null, type: null }
  }

  // Helper functions for lifestyle recommendations
  const getDynamicLifestyleCategories = (recommendations: any[]) => {
    const categoryMap = new Map<string, any[]>()
    
    recommendations.forEach(rec => {
      const category = rec.category?.toLowerCase() || 'other'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)?.push(rec)
    })

    return categoryMap
  }

  const getLifestyleCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    switch (lowerCategory) {
      case 'exercise':
      case 'fitness':
        return Dumbbell
      case 'nutrition':
      case 'diet':
      case 'diet_plan':
        return Utensils
      case 'sleep':
        return Moon
      case 'stress':
        return Zap
      default: 
        return Heart
    }
  }

  const getLifestyleCategoryColor = (category: string) => {
    // Using more neutral colors for minimalist approach
    return 'neutral'
  }

  const formatCategoryName = (category: string) => {
    // Proper formatting for category names
    const formatted = category.replace(/_/g, ' ')
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const toggleLifestyleCard = (cardId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      lifestyleCards: {
        ...prev.lifestyleCards,
        [cardId]: !prev.lifestyleCards[cardId]
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Leaf className="h-8 w-8 text-primary-500" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-neutral-800 mb-2">
            Analysis Not Found
          </h1>
          <p className="text-neutral-600 mb-6">
            {error || 'The requested analysis could not be found.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50'
    if (score >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suboptimal':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'deficient':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-neutral-500" />
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'optimal': return 'text-green-700 bg-green-50'
      case 'suboptimal': return 'text-yellow-700 bg-yellow-50'
      case 'deficient': return 'text-red-700 bg-red-50'
      default: return 'text-neutral-700 bg-neutral-50'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'biomarkers', label: 'Biomarkers', icon: Activity },
    { id: 'supplements', label: 'Supplements', icon: Pill },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'causes', label: 'Root Causes', icon: Brain },
    ...(analysis?.monitoring_plan ? [{ id: 'monitoring', label: 'Monitoring', icon: Calendar }] : [])
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="p-2 flex-shrink-0"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-light text-neutral-800">
                  Health Analysis
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-600 mt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="hidden sm:flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>#{analysis.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Download</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">

            {/* Tab Navigation */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <Card className="p-1 inline-flex min-w-full sm:flex sm:min-w-0">
                  <div className="flex space-x-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                          }`}
                          aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden xs:inline">{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Action Plan Overview */}
                  <Card className="p-6 border-2 border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                          <Target className="h-5 w-5 text-primary-600 mr-2" />
                          Your Personalized Action Plan
                        </h3>
                        <p className="text-sm text-neutral-600 mt-1">Click any card to explore detailed recommendations</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Supplements */}
                      <div 
                        className="p-4 bg-white rounded-lg border-2 border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setActiveTab('supplements')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 transition-colors">
                            <Pill className="h-5 w-5 text-primary-600" />
                          </div>
                          <span className="text-2xl font-semibold text-primary-700">{supplements.length}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Supplements</h4>
                        {supplements.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-neutral-600">
                              <span className="font-medium text-red-600">{supplements.filter(s => s.priority === 'essential').length}</span> Essential
                            </div>
                            <div className="text-xs text-neutral-600">
                              <span className="font-medium text-sage-600">{supplements.filter(s => s.priority === 'beneficial').length}</span> Beneficial
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic">No supplements needed</p>
                        )}
                      </div>

                      {/* Diet */}
                      <div 
                        className="p-4 bg-white rounded-lg border-2 border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setActiveTab('diet')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-sage-100 p-2 rounded-lg group-hover:bg-sage-200 transition-colors">
                            <Utensils className="h-5 w-5 text-sage-600" />
                          </div>
                          <span className="text-2xl font-semibold text-sage-700">{diet.length}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Diet Plans</h4>
                        {diet.length > 0 ? (
                          <div className="text-xs text-neutral-600 line-clamp-2">
                            {diet[0].plan_name || diet[0].category || 'Personalized nutrition'}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic">No diet plans</p>
                        )}
                      </div>

                      {/* Lifestyle */}
                      <div 
                        className="p-4 bg-white rounded-lg border-2 border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setActiveTab('lifestyle')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-amber-100 p-2 rounded-lg group-hover:bg-amber-200 transition-colors">
                            <Heart className="h-5 w-5 text-amber-600" />
                          </div>
                          <span className="text-2xl font-semibold text-amber-700">{lifestyle.length}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Lifestyle</h4>
                        {lifestyle.length > 0 ? (
                          <div className="text-xs text-neutral-600 line-clamp-2">
                            {lifestyle[0].specific_recommendation || lifestyle[0].category || 'Lifestyle changes'}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic">No lifestyle changes</p>
                        )}
                      </div>

                      {/* Workout */}
                      <div 
                        className="p-4 bg-white rounded-lg border-2 border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setActiveTab('workout')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                            <Dumbbell className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="text-2xl font-semibold text-emerald-700">{workout.length}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Workouts</h4>
                        {workout.length > 0 ? (
                          <div className="text-xs text-neutral-600 line-clamp-2">
                            {workout[0].plan_name || workout[0].workout_type || 'Exercise plan'}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic">No workout plans</p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Priority Biomarker Actions */}
                  <Card className="p-6 border-2 border-red-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          What Needs Attention
                        </h3>
                        <p className="text-xs text-neutral-600 mt-1">These biomarkers require immediate focus</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab('biomarkers')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {analysis.biomarker_insights
                        ?.filter((insight: any) => insight.status === 'deficient')
                        .slice(0, 5)
                        .map((insight: any, index: number) => (
                          <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-200 hover:shadow-md transition-all">
                            <div className="flex items-start space-x-3">
                              <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-neutral-900">
                                  {insight.biomarker_name || insight.biomarker}
                                </div>
                                {insight.interpretation && (
                                  <div className="text-xs text-neutral-600 mt-1 leading-relaxed line-clamp-2">
                                    {insight.interpretation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'deficient').length === 0 && (
                        <div className="text-sm text-emerald-700 text-center py-6 bg-emerald-50 rounded-lg border border-emerald-200">
                          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                          <p className="font-medium">Excellent!</p>
                          <p className="text-xs mt-1">No critical biomarker issues found</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* What's Causing Your Health Issues */}
                  {analysis.root_causes && Array.isArray(analysis.root_causes) && analysis.root_causes.length > 0 && (
                    <Card className="p-6 border-2 border-neutral-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <Brain className="h-5 w-5 text-purple-600 mr-2" />
                            What's Causing Your Issues
                          </h3>
                          <p className="text-xs text-neutral-600 mt-1">Understanding the underlying root causes</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('causes')}
                          className="text-xs"
                        >
                          View All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {analysis.root_causes
                          .filter((cause: any) => cause.priority === 'high' || cause.priority === 'medium')
                          .slice(0, 3)
                          .map((cause: any, index: number) => (
                            <div key={index} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-neutral-900 flex items-center">
                                  <Brain className="h-3.5 w-3.5 text-purple-600 mr-2 flex-shrink-0" />
                                  {cause.category}
                                </h4>
                                {cause.priority && (
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                    cause.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    cause.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {cause.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600 line-clamp-2">
                                {cause.description}
                              </p>
                            </div>
                          ))}
                        {analysis.root_causes.filter((cause: any) => cause.priority === 'high' || cause.priority === 'medium').length === 0 && (
                          <div className="text-sm text-emerald-700 text-center py-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
                            <p className="font-medium">Great news! No major root causes identified</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Health Assessment Overview */}
                  {analysis.overall_health_assessment && (
                    <>
                      {/* Health Trajectory - Featured */}
                      {analysis.overall_health_assessment.trajectory && (
                        <Card className="p-6 bg-gradient-to-br from-blue-50 via-primary-50 to-white border-2 border-primary-200">
                          <div className="flex items-start space-x-3">
                            <div className="bg-primary-100 p-2.5 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Your Health Journey</h3>
                              <p className="text-sm text-neutral-700 leading-relaxed">
                                {analysis.overall_health_assessment.trajectory}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Concerns & Strengths Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Priority Concerns */}
                        {analysis.overall_health_assessment.priority_concerns && 
                         Array.isArray(analysis.overall_health_assessment.priority_concerns) &&
                         analysis.overall_health_assessment.priority_concerns.length > 0 && (
                          <Card className="p-6 border-2 border-orange-100">
                            <h4 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
                              <div className="bg-orange-100 p-1.5 rounded-lg mr-2">
                                <Info className="h-4 w-4 text-orange-600" />
                              </div>
                              Areas to Address
                            </h4>
                            <div className="space-y-2">
                              {analysis.overall_health_assessment.priority_concerns.slice(0, 4).map((concern: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2 p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100 hover:shadow-sm transition-shadow">
                                  <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                                  </div>
                                  <p className="text-sm text-neutral-700 leading-relaxed">{concern}</p>
                                </div>
                              ))}
                              {analysis.overall_health_assessment.priority_concerns.length > 4 && (
                                <p className="text-xs text-neutral-500 text-center pt-2 font-medium">
                                  +{analysis.overall_health_assessment.priority_concerns.length - 4} more areas to explore
                                </p>
                              )}
                            </div>
                          </Card>
                        )}

                        {/* Key Strengths */}
                        {analysis.overall_health_assessment.key_strengths && 
                         Array.isArray(analysis.overall_health_assessment.key_strengths) &&
                         analysis.overall_health_assessment.key_strengths.length > 0 && (
                          <Card className="p-6 border-2 border-emerald-100">
                            <h4 className="text-base font-semibold text-neutral-900 mb-3 flex items-center">
                              <div className="bg-emerald-100 p-1.5 rounded-lg mr-2">
                                <Shield className="h-4 w-4 text-emerald-600" />
                              </div>
                              Your Health Strengths
                            </h4>
                            <div className="space-y-2">
                              {analysis.overall_health_assessment.key_strengths.slice(0, 4).map((strength: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2 p-3 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100 hover:shadow-sm transition-shadow">
                                  <div className="bg-emerald-100 p-1 rounded-full mt-0.5">
                                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                                  </div>
                                  <p className="text-sm text-neutral-700 leading-relaxed">{strength}</p>
                                </div>
                              ))}
                              {analysis.overall_health_assessment.key_strengths.length > 4 && (
                                <p className="text-xs text-neutral-500 text-center pt-2 font-medium">
                                  +{analysis.overall_health_assessment.key_strengths.length - 4} more strengths
                                </p>
                              )}
                            </div>
                          </Card>
                        )}
                      </div>
                    </>
                  )}

                  {/* Celebrating Your Health Wins */}
                  {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'optimal').length > 0 && (
                    <Card className="p-6 bg-gradient-to-br from-emerald-50 via-green-50 to-white border-2 border-emerald-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <div className="bg-emerald-100 p-2 rounded-lg mr-2">
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            Celebrating Your Health Wins
                          </h3>
                          <p className="text-xs text-neutral-600 mt-1 ml-11">
                            These biomarkers are in optimal ranges - keep up the great work!
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">
                            {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'optimal').length}
                          </div>
                          <div className="text-xs text-neutral-500">optimal</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {analysis.biomarker_insights
                          ?.filter((insight: any) => insight.status === 'optimal')
                          .slice(0, 8)
                          .map((insight: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-emerald-200 hover:shadow-md transition-all">
                              <div className="bg-emerald-100 p-1 rounded-full">
                                <CheckCircle className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              </div>
                              <div className="text-sm font-medium text-neutral-900 truncate">
                                {insight.biomarker_name || insight.biomarker}
                              </div>
                            </div>
                          ))}
                      </div>
                      {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'optimal').length > 8 && (
                        <div className="mt-4 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('biomarkers')}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            View All {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'optimal').length} Optimal Biomarkers
                          </Button>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'biomarkers' && (
                <div className="space-y-6">
                  {(() => {
                    // Use biomarker_readings as the single source of truth
                    const allBiomarkers: any[] = []
                    
                    // Helper function to normalize biomarker names for comparison
                    const normalizeName = (name: string | null | undefined) => {
                      if (!name) return ''
                      return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
                    }
                    
                    // Helper function to find insight with flexible matching
                    const findInsight = (biomarkerName: string) => {
                      if (!analysis.biomarker_insights) return null
                      
                      const normalizedSearchName = normalizeName(biomarkerName)
                      
                      return analysis.biomarker_insights.find((insight: any) => {
                        const insightName = insight.biomarker_name || insight.biomarker
                        if (!insightName) return false
                        
                        const normalizedInsightName = normalizeName(insightName)
                        
                        // Try exact match first
                        if (normalizedInsightName === normalizedSearchName) return true
                        
                        // Try partial matches (one contains the other)
                        if (normalizedInsightName.includes(normalizedSearchName) || 
                            normalizedSearchName.includes(normalizedInsightName)) {
                          return true
                        }
                        
                        return false
                      })
                    }
                    
                    // Process ONLY biomarker_readings as the source of truth
                    if (analysis.biomarker_readings && analysis.biomarker_readings.length > 0) {
                      analysis.biomarker_readings.forEach((reading: any, index: number) => {
                        // Get biomarker name from multiple possible sources
                        const biomarkerName = reading.biomarkers?.name || 
                                            reading.biomarker_name || 
                                            reading.name ||
                                            `Biomarker ${index + 1}` // Fallback for unnamed biomarkers
                        
                        // Find matching insight to enrich the data (only if we have a proper name)
                        const insight = biomarkerName !== `Biomarker ${index + 1}` ? findInsight(biomarkerName) : null
                        
                        // Get status from reading first, then biomarker (if linked), then insight
                        const status = reading.status || 
                                      reading.biomarkers?.status || 
                                      insight?.status || 
                                      null
                        
                        // Create enriched biomarker object
                        const enrichedBiomarker = {
                          // Core data from reading - always include
                          biomarker_name: biomarkerName,
                          biomarker: biomarkerName,
                          current_value: reading.value,
                          value: reading.value,
                          unit: reading.unit || reading.biomarkers?.unit || '', // Empty string instead of undefined
                          status: status,
                          
                          // Reading data
                          biomarkerData: reading,
                          
                          // Enrichment flags
                          hasInsight: !!insight,
                          hasBiomarkerData: !!reading.biomarkers, // New flag to track if linked to biomarker table
                          
                          // Enrichment from insight (if available) - include ALL fields from mobile app
                          ...(insight && {
                            // Add all insight data fields to match mobile app
                            optimal_range: insight.optimal_range,
                            gap_analysis: insight.gap_analysis,
                            clinical_significance: insight.clinical_significance,
                            functional_medicine_perspective: insight.functional_medicine_perspective,
                            interconnections: insight.interconnections,
                            priority_for_intervention: insight.priority_for_intervention,
                            interpretation: insight.interpretation,
                            recommendations: insight.recommendations
                          })
                        }
                        
                        allBiomarkers.push(enrichedBiomarker)
                      })
                    } else {
                      // Fallback: if no biomarker_readings, use insights only
                      analysis.biomarker_insights?.forEach((insight: any) => {
                        allBiomarkers.push({ 
                          ...insight, 
                          hasInsight: true,
                          biomarkerData: null
                        })
                      })
                    }

                    // Group by status
                    const biomarkersByStatus = groupBiomarkersByStatus(allBiomarkers)
                    
                    if (allBiomarkers.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Activity className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-neutral-800 mb-2">No biomarkers found</h3>
                          <p className="text-neutral-500">
                            No biomarker data could be extracted from your lab results.
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Status Navigation Sidebar */}
                        <div className="lg:col-span-1 order-2 lg:order-1">
                          <motion.div
                            initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                            animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                          >
                            <Card className="p-4 sticky top-6">
                              <h4 className="text-sm font-medium text-neutral-800 mb-3">Filter by Status</h4>
                              <div className="space-y-2">
                                {[
                                  { 
                                    id: 'priority', 
                                    label: 'Priority Issues', 
                                    icon: AlertCircle,
                                    count: (biomarkersByStatus['deficient'] || []).length + (biomarkersByStatus['concerning'] || []).length,
                                    activeColor: 'bg-neutral-100 border-neutral-200',
                                    inactiveColor: 'hover:bg-neutral-50',
                                    iconColor: 'text-red-500'
                                  },
                                  { 
                                    id: 'suboptimal', 
                                    label: 'Suboptimal', 
                                    icon: TrendingUp,
                                    count: (biomarkersByStatus['suboptimal'] || []).length,
                                    activeColor: 'bg-neutral-100 border-neutral-200',
                                    inactiveColor: 'hover:bg-neutral-50',
                                    iconColor: 'text-amber-500'
                                  },
                                  { 
                                    id: 'optimal', 
                                    label: 'Optimal', 
                                    icon: CheckCircle,
                                    count: (biomarkersByStatus['optimal'] || []).length,
                                    activeColor: 'bg-neutral-100 border-neutral-200',
                                    inactiveColor: 'hover:bg-neutral-50',
                                    iconColor: 'text-green-500'
                                  },
                                  { 
                                    id: 'all', 
                                    label: 'All Biomarkers', 
                                    icon: Activity,
                                    count: allBiomarkers.length,
                                    activeColor: 'bg-neutral-100 border-neutral-200',
                                    inactiveColor: 'hover:bg-neutral-50',
                                    iconColor: 'text-neutral-500'
                                  }
                                ].map((filter) => {
                                  if (filter.count === 0 && filter.id !== 'all') return null
                                  
                                  const Icon = filter.icon
                                  const isActive = activeBiomarkerTab === filter.id
                                  
                                  return (
                                    <button
                                      key={filter.id}
                                      onClick={() => setActiveBiomarkerTab(filter.id)}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border text-neutral-700 ${
                                        isActive ? filter.activeColor : `${filter.inactiveColor} border-transparent`
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Icon className={`h-4 w-4 ${isActive ? filter.iconColor : 'text-neutral-500'}`} />
                                        <span>{filter.label}</span>
                                      </div>
                                      <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                                        {filter.count}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </Card>
                          </motion.div>
                        </div>

                        {/* Biomarker Cards */}
                        <div className="lg:col-span-3 order-1 lg:order-2">
                          {(() => {
                            let biomarkersToShow = allBiomarkers
                            let categoryTitle = 'All Biomarkers'
                            let categoryDescription = 'Complete analysis of all biomarkers'
                            let categoryIcon = Activity
                            let categoryColors = {
                              iconColor: 'text-neutral-500',
                              bgColor: 'bg-neutral-50',
                              borderColor: 'border-neutral-100'
                            }
                            
                            if (activeBiomarkerTab === 'priority') {
                              biomarkersToShow = [
                                ...(biomarkersByStatus['deficient'] || []),
                                ...(biomarkersByStatus['concerning'] || [])
                              ]
                              categoryTitle = 'Priority Issues'
                              categoryDescription = 'Biomarkers requiring immediate attention'
                              categoryIcon = AlertCircle
                              categoryColors = {
                                iconColor: 'text-red-500',
                                bgColor: 'bg-red-50',
                                borderColor: 'border-red-100'
                              }
                            } else if (activeBiomarkerTab === 'suboptimal') {
                              biomarkersToShow = biomarkersByStatus['suboptimal'] || []
                              categoryTitle = 'Suboptimal Biomarkers'
                              categoryDescription = 'Biomarkers that could be optimized'
                              categoryIcon = TrendingUp
                              categoryColors = {
                                iconColor: 'text-amber-500',
                                bgColor: 'bg-amber-50',
                                borderColor: 'border-amber-100'
                              }
                            } else if (activeBiomarkerTab === 'optimal') {
                              biomarkersToShow = biomarkersByStatus['optimal'] || []
                              categoryTitle = 'Optimal Biomarkers'
                              categoryDescription = 'Biomarkers within optimal ranges'
                              categoryIcon = CheckCircle
                              categoryColors = {
                                iconColor: 'text-green-500',
                                bgColor: 'bg-green-50',
                                borderColor: 'border-green-100'
                              }
                            }
                            
                            const Icon = categoryIcon
                            
                            return (
                              <div className="space-y-2">
                                {/* Category Description */}
                                <div className="text-center">
                                  <div className="flex items-center justify-left space-x-3 mb-2">
                                    <div className={`p-2 rounded-full`}>
                                      <Icon className={`h-4 w-4`} />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-800">{categoryTitle}</h3>
                                    <p className="text-sm text-neutral-500">( {categoryDescription} )</p>
                                  </div>     
                                </div>
                                
                                {/* Biomarker Cards */}
                                {biomarkersToShow.length > 0 ? (
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {biomarkersToShow
                                      .sort((a: any, b: any) => {
                                        // Sort by status priority first (matching mobile app)
                                        const priorityA = getStatusPriority(a.status)
                                        const priorityB = getStatusPriority(b.status)
                                        
                                        if (priorityA !== priorityB) {
                                          return priorityA - priorityB
                                        }
                                        
                                        // If same priority, sort alphabetically by name
                                        const nameA = (a.biomarker_name || a.biomarker || '').toLowerCase()
                                        const nameB = (b.biomarker_name || b.biomarker || '').toLowerCase()
                                        return nameA.localeCompare(nameB)
                                      })
                                      .map((insight: any, index: number) => {
                                      const globalIndex = `${activeBiomarkerTab}_${index}`
                                      const statusInfo = getStatusDisplayInfo(insight.status)
                                      const biomarkerDetails = getBiomarkerDetails(insight.biomarker_name || insight.biomarker)
                                      const optimalRanges = getOptimalRanges(insight.biomarker_name || insight.biomarker)
                                      const currentValue = insight.current_value || insight.value
                                      const valueStatus = getCurrentValueStatus(currentValue, insight.biomarker_name || insight.biomarker, insight.unit)
                                      
                                      return (
                                        <Card key={globalIndex} className={`group hover:shadow-lg transition-all duration-300 bg-white flex flex-col h-full`}>
                                          {/* Card Header */}
                                          <div className="p-0 flex-grow">
                                            <div className="mb-4 min-h-[60px] flex flex-col justify-start">
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 pr-2">
                                                  <h4 className="text-base font-semibold text-neutral-800 leading-tight">
                                                    {insight.biomarker_name || insight.biomarker}
                                                  </h4>
                                                  {/* Only show Limited Data if biomarker has no insight (matching mobile app logic) */}
                                                  {!insight.hasInsight && (
                                                    <span className="inline-block mt-1 text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded">
                                                      Limited Data
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex-shrink-0 ml-3 text-right">
                                                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor} whitespace-nowrap`}>
                                                    {statusInfo.label}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="min-h-[16px] flex items-start">
                                                {biomarkerDetails?.category && (
                                                  <div className="text-xs font-normal text-neutral-500">
                                                    {biomarkerDetails.category}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Quick Info */}
                                            <div className="space-y-3">
                                              <div className="min-h-[32px] flex items-start justify-between gap-3">
                                                <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Current Value</span>
                                                <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">
                                                  {currentValue} {insight.unit}
                                                </span>
                                              </div>
                                              
                                              {/* Optimal Range Section - prioritize insight.optimal_range, fallback to database ranges */}
                                              {(insight.optimal_range || optimalRanges.length > 0) && (
                                                <div className="flex flex-col justify-start">
                                                  <div className="flex items-start justify-between gap-3 mb-1">
                                                    <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Optimal Range</span>
                                                    <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">
                                                      {(() => {
                                                        const rangeValue = insight.optimal_range || (() => {
                                                          const primaryRange = optimalRanges.find((r: any) => r.is_primary) || optimalRanges[0]
                                                          return `${formatRangeValue(primaryRange.optimal_min, insight.unit)} - ${formatRangeValue(primaryRange.optimal_max, insight.unit)}`
                                                        })()
                                                        // Extract main value and comment (in parentheses)
                                                        const match = rangeValue.match(/^([^(]+)(\(.+\))?$/)
                                                        if (match) {
                                                          const [, mainValue] = match
                                                          return mainValue.trim()
                                                        }
                                                        return rangeValue
                                                      })()}
                                                    </span>
                                                  </div>
                                                  {(() => {
                                                    const rangeValue = insight.optimal_range || (() => {
                                                      const primaryRange = optimalRanges.find((r: any) => r.is_primary) || optimalRanges[0]
                                                      return `${formatRangeValue(primaryRange.optimal_min, insight.unit)} - ${formatRangeValue(primaryRange.optimal_max, insight.unit)}`
                                                    })()
                                                    // Extract comment in parentheses
                                                    const match = rangeValue.match(/^([^(]+)(\(.+\))?$/)
                                                    if (match && match[2]) {
                                                      return (
                                                        <div className="text-xs font-normal text-neutral-500 normal-case text-right">
                                                          {match[2]}
                                                        </div>
                                                      )
                                                    }
                                                    return null
                                                  })()}
                                                </div>
                                              )}
                                              
                                              {/* Conventional Range Section */}
                                              {biomarkerDetails && 
                                               biomarkerDetails.conventional_min !== null && 
                                               biomarkerDetails.conventional_max !== null &&
                                               biomarkerDetails.conventional_min !== undefined && 
                                               biomarkerDetails.conventional_max !== undefined && (
                                                <div className="min-h-[20px] flex items-start justify-between gap-3">
                                                  <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Conventional Range</span>
                                                  <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">
                                                    {formatRangeValue(biomarkerDetails.conventional_min, insight.unit)} - {formatRangeValue(biomarkerDetails.conventional_max, insight.unit)}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Expandable Details */}
                                          <div className="border-t border-neutral-100 mt-auto">
                                            <details className="group/details">
                                              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                                                <span className="text-xs font-medium text-neutral-700">View Details</span>
                                                <ChevronDown className="h-3 w-3 text-neutral-500 group-open/details:rotate-180 transition-transform" />
                                              </summary>
                                              
                                              <div className="px-4 pb-4 space-y-4 border-t border-neutral-50">
                                                {/* Priority for Intervention */}
                                                {insight.priority_for_intervention && insight.priority_for_intervention !== 'low' && (
                                                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <div className={`w-2 h-2 rounded-full ${
                                                        insight.priority_for_intervention === 'critical' ? 'bg-red-600' :
                                                        insight.priority_for_intervention === 'high' ? 'bg-amber-500' :
                                                        'bg-primary-500'
                                                      }`} />
                                                      <h5 className="text-xs font-semibold text-neutral-800">
                                                        {insight.priority_for_intervention.toUpperCase()} Priority for Intervention
                                                      </h5>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Gap Analysis */}
                                                {insight.gap_analysis && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Analysis</h5>
                                                    <ExpandableText
                                                      text={insight.gap_analysis}
                                                      maxLines={isMobile ? 3 : 4}
                                                      className="text-xs text-neutral-600 leading-relaxed"
                                                    />
                                                  </div>
                                                )}

                                                {/* Description */}
                                                {biomarkerDetails?.description && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">What is this?</h5>
                                                    <ExpandableText
                                                      text={biomarkerDetails.description}
                                                      maxLines={isMobile ? 3 : 5}
                                                      className="text-xs text-neutral-600 leading-relaxed"
                                                    />
                                                  </div>
                                                )}

                                                {/* Clinical Significance */}
                                                {(biomarkerDetails?.clinical_significance || insight.clinical_significance || insight.hasInsight) && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Clinical Significance</h5>
                                                    <ExpandableText
                                                      text={biomarkerDetails?.clinical_significance || 
                                                       insight.clinical_significance || 
                                                       insight.interpretation ||
                                                       'Clinical significance information not available for this biomarker.'}
                                                      maxLines={isMobile ? 2 : 4}
                                                      className="text-xs text-neutral-600 leading-relaxed"
                                                    />
                                                  </div>
                                                )}

                                                {/* Functional Medicine Perspective */}
                                                {insight.functional_medicine_perspective && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Functional Medicine View</h5>
                                                    <ExpandableText
                                                      text={insight.functional_medicine_perspective}
                                                      maxLines={isMobile ? 2 : 4}
                                                      className="text-xs text-neutral-600 leading-relaxed"
                                                    />
                                                  </div>
                                                )}

                                                {/* Interconnections */}
                                                {insight.interconnections && Array.isArray(insight.interconnections) && insight.interconnections.length > 0 && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Related Biomarkers</h5>
                                                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1 ml-2">
                                                      {insight.interconnections.map((connection: string, idx: number) => (
                                                        <li key={idx}>{connection}</li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {/* Recommendations */}
                                                {(insight.hasInsight && insight.recommendations && insight.recommendations.length > 0) && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Recommendations</h5>
                                                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1 ml-2">
                                                      {insight.recommendations.map((rec: string, recIndex: number) => (
                                                        <li key={recIndex}>{rec}</li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {/* Range Information */}
                                                {(biomarkerDetails || optimalRanges.length > 0) && (
                                                  <div className="pt-3 border-t border-neutral-100">
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2 flex items-center">
                                                      <Target className="h-3 w-3 mr-1.5" />
                                                      Reference Ranges
                                                    </h5>
                                                    <div className="space-y-3">
                                                      {/* Conventional Range */}
                                                      {biomarkerDetails && 
                                                       biomarkerDetails.conventional_min !== null && 
                                                       biomarkerDetails.conventional_max !== null &&
                                                       biomarkerDetails.conventional_min !== undefined && 
                                                       biomarkerDetails.conventional_max !== undefined && (
                                                        <div className="bg-neutral-100 p-2 rounded">
                                                          <div className="text-xs font-medium text-neutral-700 mb-1">Conventional Range</div>
                                                          <div className="text-xs text-neutral-800 font-medium">
                                                            {formatRangeValue(biomarkerDetails.conventional_min, insight.unit)} - {formatRangeValue(biomarkerDetails.conventional_max, insight.unit)}
                                                          </div>
                                                          <div className="text-xs text-neutral-600 mt-1">Standard laboratory reference</div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Optimal Ranges */}
                                                      {optimalRanges.length > 0 && (
                                                        <div className="space-y-2">
                                                          {optimalRanges.slice(0, 2).map((range: any, rangeIndex: number) => (
                                                            <div key={rangeIndex} className="bg-green-100 p-2 rounded">
                                                              <div className="text-xs font-medium text-green-700 mb-1">
                                                                Optimal Range {range.gender !== 'all' ? `(${range.gender})` : ''}
                                                              </div>
                                                              <div className="text-xs text-green-800 font-medium">
                                                                {formatRangeValue(range.optimal_min, insight.unit)} - {formatRangeValue(range.optimal_max, insight.unit)}
                                                              </div>
                                                              <div className="text-xs text-green-600 mt-1">
                                                                Evidence: {range.evidence_level || 'Moderate'} • 
                                                                Confidence: {range.confidence_level || 'Medium'}
                                                              </div>
                                                            </div>
                                                          ))}
                                                          {optimalRanges.length > 2 && (
                                                            <div className="text-center">
                                                              <span className="text-xs text-green-600">
                                                                +{optimalRanges.length - 2} more optimal range{optimalRanges.length - 2 > 1 ? 's' : ''}
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                      
                                                      {/* No ranges available */}
                                                      {!biomarkerDetails && optimalRanges.length === 0 && (
                                                        <div className="text-xs text-neutral-500 italic">
                                                          No reference ranges available for this biomarker
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </details>
                                          </div>
                                        </Card>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-12">
                                    <Icon className={`h-12 w-12 mx-auto mb-4 ${categoryColors.iconColor}`} />
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No {categoryTitle.toLowerCase()} found</h3>
                                    <p className="text-neutral-500">
                                      {activeBiomarkerTab === 'priority' ? 'Great news! No critical issues were identified.' :
                                       activeBiomarkerTab === 'suboptimal' ? 'All biomarkers are within acceptable ranges.' :
                                       activeBiomarkerTab === 'optimal' ? 'No biomarkers are currently in optimal ranges.' :
                                       'No biomarkers available to display.'}
                                    </p>
                                  </div>
                                )}
                                
                                {/* Action Section */}
                                {biomarkersToShow.length > 0 && (
                                  <div className="text-center space-y-6 pt-8 border-t border-neutral-100">
                                    <div className="space-y-2">
                                      <h3 className="text-lg font-medium text-neutral-800">Need more insights?</h3>
                                      <p className="text-neutral-500">
                                        {biomarkersToShow.length} biomarker{biomarkersToShow.length !== 1 ? 's' : ''} analyzed in this category
                                      </p>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                      <Button variant="outline" size="md" className="w-full sm:w-auto">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Report
                                      </Button>
                                      <Button variant="outline" size="md" className="w-full sm:w-auto">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Track Progress
                                      </Button>
                                      <Button 
                                        size="md" 
                                        className="w-full sm:w-auto"
                                        onClick={() => setActiveTab('supplements')}
                                      >
                                        View Recommendations
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {activeTab === 'supplements' && (
                <div className="space-y-6">
                  {supplements && supplements.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Priority Navigation */}
                      <div className="lg:col-span-1 order-2 lg:order-1">
                        <motion.div
                          initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                          animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                        >
                          <Card className="p-4 sticky top-6">
                            <h4 className="text-sm font-medium text-neutral-800 mb-3">Priority Levels</h4>
                            <div className="space-y-2">
                              {['essential', 'beneficial', 'optional'].map((priority) => {
                                const filteredSupplements = supplements.filter((rec: any) => rec.priority === priority)
                                if (filteredSupplements.length === 0) return null
                                
                                const priorityConfig = {
                                  essential: { 
                                    label: 'Essential', 
                                    icon: AlertCircle, 
                                    activeColor: 'bg-primary-50 text-primary-700 border-primary-200',
                                    inactiveColor: 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                                  },
                                  beneficial: { 
                                    label: 'Beneficial', 
                                    icon: Heart, 
                                    activeColor: 'bg-sage-50 text-sage-700 border-sage-200',
                                    inactiveColor: 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                                  },
                                  optional: { 
                                    label: 'Optional', 
                                    icon: Shield, 
                                    activeColor: 'bg-neutral-100 text-neutral-700 border-neutral-200',
                                    inactiveColor: 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                                  }
                                }
                                
                                const config = priorityConfig[priority as keyof typeof priorityConfig]
                                const Icon = config.icon
                                const isActive = activeSupplementTab === priority
                                
                                return (
                                  <button
                                    key={priority}
                                    onClick={() => setActiveSupplementTab(priority)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                      isActive ? config.activeColor : `${config.inactiveColor} border-transparent`
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon className="h-4 w-4" />
                                      <span>{config.label}</span>
                                    </div>
                                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                                      {filteredSupplements.length}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Supplement Cards */}
                      <div className="lg:col-span-3 order-1 lg:order-2">
                        {(() => {
                          const filteredSupplements = supplements.filter((rec: any) => rec.priority === activeSupplementTab)
                          
                          const priorityConfig = {
                            essential: { 
                              label: 'Essential', 
                              icon: AlertCircle, 
                              iconColor: 'text-primary-500',
                              bgColor: 'bg-primary-50',
                              borderColor: 'border-primary-100',
                              badgeColor: 'bg-primary-50 text-primary-500',
                              description: 'Critical for addressing deficiencies'
                            },
                            beneficial: { 
                              label: 'Beneficial', 
                              icon: Heart, 
                              iconColor: 'text-sage-500',
                              bgColor: 'bg-sage-50',
                              borderColor: 'border-primary-100',
                              badgeColor: 'bg-sage-50 text-sage-500',
                              description: 'Recommended for optimization'
                            },
                            optional: { 
                              label: 'Optional', 
                              icon: Shield, 
                              iconColor: 'text-neutral-400',
                              bgColor: 'bg-neutral-50',
                              borderColor: 'border-neutral-100',
                              badgeColor: 'bg-neutral-50 text-neutral-400',
                              description: 'Additional support for specific goals'
                            }
                          }
                          
                          const config = priorityConfig[activeSupplementTab as keyof typeof priorityConfig]
                          const Icon = config.icon
                          
                          return (
                            <div className="space-y-2">
                              {/* Category Description */}
                              <div className="text-center">
                                <div className="flex items-center justify-left space-x-3 mb-2">
                                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                                  </div>
                                  <h3 className="text-lg font-medium text-neutral-800">{config.label} Supplements</h3>
                                  <p className="text-sm text-neutral-500">( {config.description} )</p>
                                </div>     
                              </div>
                              
                              {/* Supplement Cards */}
                              <div className="grid gap-4 md:grid-cols-2">
                              {filteredSupplements.map((supplement: any, index: number) => {
                                // Map database fields to display format (matching mobile app)
                                const supplementName = supplement.supplement_name || supplement.name || '';
                                const dosage = supplement.dosage_amount && supplement.dosage_unit 
                                  ? `${supplement.dosage_amount}${supplement.dosage_unit}`
                                  : supplement.dosage || '';
                                const duration = supplement.duration_weeks 
                                  ? `${supplement.duration_weeks} weeks`
                                  : supplement.duration || '';
                                const monitoring = supplement.monitoring_needed && Array.isArray(supplement.monitoring_needed)
                                  ? supplement.monitoring_needed.join(', ')
                                  : supplement.monitoring || '';
                                const costEstimate = supplement.estimated_monthly_cost 
                                  ? `$${supplement.estimated_monthly_cost}`
                                  : supplement.cost_estimate || '';
                                const reasoning = supplement.reason || supplement.reasoning || '';
                                const expectedImprovement = supplement.expected_outcome || supplement.expected_improvement || '';
                                
                                return (
                                <Card key={index} className={`group hover:shadow-lg transition-all duration-300 ${config.borderColor} bg-white flex flex-col h-full`}>
                                  {/* Card Header */}
                                  <div className="p-4 flex-grow">
                                    <div className="mb-4 min-h-[60px] flex flex-col justify-start">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 pr-2">
                                          <h4 className="text-base font-semibold text-neutral-800 leading-tight">
                                            {(() => {
                                              const match = supplementName.match(/^([^(]+)(\(.+\))?$/);
                                              if (match) {
                                                const [, mainName] = match;
                                                return mainName.trim();
                                              }
                                              return supplementName;
                                            })()}
                                          </h4>
                                        </div>
                                        <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                                          {duration && (
                                            <span 
                                              className={`px-2 py-1 text-xs font-medium rounded-full ${config.badgeColor} whitespace-nowrap`}
                                            >
                                              {duration}
                                            </span>
                                          )}
                                          {supplement.id && (
                                            <CartButton
                                              recommendationId={supplement.id}
                                              supplementName={supplementName}
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <div className="min-h-[16px] flex items-start">
                                        {(() => {
                                          const match = supplementName.match(/^([^(]+)(\(.+\))?$/);
                                          if (match && match[2]) {
                                            return (
                                              <div className="text-xs font-normal text-neutral-500">
                                                {match[2]}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </div>
                                    
                                    {/* Quick Info - Always Visible */}
                                    <div className="space-y-2 mb-4">
                                      {dosage && (
                                        <div className="flex items-start justify-between gap-3">
                                          <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Dosage</span>
                                          <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">{dosage}</span>
                                        </div>
                                      )}
                                      {supplement.form && (
                                        <div className="flex items-start justify-between gap-3">
                                          <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Form</span>
                                          <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed capitalize">{supplement.form}</span>
                                        </div>
                                      )}
                                      {supplement.frequency && (
                                        <div className="flex items-start justify-between gap-3">
                                          <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Frequency</span>
                                          <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">{supplement.frequency}</span>
                                        </div>
                                      )}
                                      {supplement.timing && (
                                        <div className="flex flex-col justify-start">
                                          <div className="flex items-start justify-between gap-3 mb-1">
                                            <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Timing</span>
                                            <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed capitalize">
                                              {(() => {
                                                const match = supplement.timing.match(/^([^(]+)(\(.+\))?$/);
                                                if (match) {
                                                  const [, mainTiming] = match;
                                                  return mainTiming.trim();
                                                }
                                                return supplement.timing;
                                              })()}
                                            </span>
                                          </div>
                                          {(() => {
                                            const match = supplement.timing.match(/^([^(]+)(\(.+\))?$/);
                                            if (match && match[2]) {
                                              return (
                                                <div className="text-xs font-normal text-neutral-500 normal-case text-right">
                                                  {match[2]}
                                                </div>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      )}
                                      {costEstimate && (
                                        <div className="flex items-start justify-between gap-3">
                                          <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Cost</span>
                                          <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">{costEstimate}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Reasoning Preview - Always Visible */}
                                    {reasoning && (
                                      <div className="mb-4">
                                        <ExpandableText
                                          text={reasoning}
                                          maxLines={2}
                                          className="text-xs text-neutral-600 leading-relaxed"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Expandable Details */}
                                  <div className="border-t border-neutral-100 mt-auto">
                                    <details className="group/details">
                                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                                        <span className="text-xs font-medium text-neutral-700">View More Details</span>
                                        <ChevronDown className="h-3 w-3 text-neutral-500 group-open/details:rotate-180 transition-transform" />
                                      </summary>
                                      
                                      <div className="px-4 pb-4 space-y-4 border-t border-neutral-50">
                                        {/* Full Reasoning */}
                                        {reasoning && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2">Why This Helps</h5>
                                            <ExpandableText
                                              text={reasoning}
                                              maxLines={isMobile ? 4 : 6}
                                              className="text-xs text-neutral-600 leading-relaxed"
                                            />
                                          </div>
                                        )}
                                        
                                        {/* Duration Details */}
                                        {duration && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-1">Duration</h5>
                                            <p className="text-xs text-neutral-600">{duration}</p>
                                          </div>
                                        )}
                                        
                                        {/* Target Biomarkers */}
                                        {supplement.target_biomarkers && Array.isArray(supplement.target_biomarkers) && supplement.target_biomarkers.length > 0 && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2">Target Biomarkers</h5>
                                            <div className="flex flex-wrap gap-1.5">
                                              {supplement.target_biomarkers.map((biomarker: string, idx: number) => (
                                                <span key={idx} className="inline-block px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600">
                                                  {biomarker}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Expected Results */}
                                        {expectedImprovement && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2">Expected Results</h5>
                                            <ExpandableText
                                              text={expectedImprovement}
                                              maxLines={isMobile ? 3 : 4}
                                              className="text-xs text-neutral-600 leading-relaxed"
                                            />
                                          </div>
                                        )}
                                        
                                        {/* Safety Information */}
                                        {((supplement.contraindications && Array.isArray(supplement.contraindications) && supplement.contraindications.length > 0) || 
                                          (supplement.drug_interactions && Array.isArray(supplement.drug_interactions) && supplement.drug_interactions.length > 0) || 
                                          monitoring) && (
                                          <div className="pt-3 border-t border-neutral-100">
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2 flex items-center">
                                              <Shield className="h-3 w-3 mr-1.5" />
                                              Safety Information
                                            </h5>
                                            <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
                                              {supplement.contraindications && Array.isArray(supplement.contraindications) && supplement.contraindications.length > 0 && (
                                                <div>
                                                  <span className="font-semibold">Contraindications: </span>
                                                  <span>{supplement.contraindications.join(', ')}</span>
                                                </div>
                                              )}
                                              {supplement.drug_interactions && Array.isArray(supplement.drug_interactions) && supplement.drug_interactions.length > 0 && (
                                                <div>
                                                  <span className="font-semibold">Drug Interactions: </span>
                                                  <span>{supplement.drug_interactions.join(', ')}</span>
                                                </div>
                                              )}
                                              {monitoring && (
                                                <div>
                                                  <span className="font-semibold">Monitoring Needed: </span>
                                                  <span>{monitoring}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      
                                      </div>
                                    </details>
                                  </div>
                                </Card>
                              )})}
                              </div>
                              
                              {/* Action Section */}
                              <div className="text-center space-y-6 pt-8 border-t border-neutral-100">
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium text-neutral-800">Ready to get started?</h3>
                                  <p className="text-neutral-500">
                                    Total of {supplements.length} personalized recommendations
                                  </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                  <Button variant="outline" size="md" className="w-full sm:w-auto">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Plan
                                  </Button>
                                  <Button variant="outline" size="md" className="w-full sm:w-auto">
                                    <Pill className="h-4 w-4 mr-2" />
                                    Shop Supplements
                                  </Button>
                                  <Button size="md" className="w-full sm:w-auto">
                                    Create Reminder Plan
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Pill className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-2">No supplements recommended</h3>
                      <p className="text-neutral-500">
                        Based on your current biomarker levels, no additional supplements are needed at this time.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diet' && (
                <div className="space-y-6">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-medium text-neutral-800 flex items-center">
                        <Utensils className="h-5 w-5 text-primary-600 mr-2" />
                        Diet Plan
                      </h3>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    
                    {diet && diet.length > 0 ? (
                      <div className="space-y-6">
                        {diet.map((dietPlan: any, index: number) => {
                          const cardId = `diet-${index}`
                          const isExpanded = expandedDetails.lifestyleCards[cardId] // Reuse lifestyleCards state
                          
                          return (
                            <div key={index} className="border border-neutral-200 hover:border-neutral-300 rounded-lg transition-all duration-200">
                              {/* Card Header - Always Visible */}
                              <div 
                                className="p-3 sm:p-4 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                onClick={() => {
                                  setExpandedDetails(prev => ({
                                    ...prev,
                                    lifestyleCards: {
                                      ...prev.lifestyleCards,
                                      [cardId]: !prev.lifestyleCards[cardId]
                                    }
                                  }))
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                    <div className="p-1.5 sm:p-2 rounded-full bg-primary-100 flex-shrink-0">
                                      <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-sm sm:text-base font-medium text-neutral-800 capitalize">
                                        {dietPlan.plan_name || dietPlan.category || 'Diet Plan'}
                                      </h4>
                                      <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 mt-1">
                                        {dietPlan.reasoning || dietPlan.plan_type || ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                    {dietPlan.priority && (
                                      <span className={`hidden sm:inline text-xs px-2 py-1 rounded border whitespace-nowrap ${
                                        dietPlan.priority === 'essential' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                        dietPlan.priority === 'beneficial' ? 'bg-sage-50 text-sage-700 border-sage-200' :
                                        'bg-neutral-50 text-neutral-600 border-neutral-200'
                                      }`}>
                                        {dietPlan.priority}
                                      </span>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="border-t border-neutral-200 p-4 bg-white space-y-4">
                                  {dietPlan.reasoning && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                        <Info className="h-3 w-3 mr-1" />
                                        Why this helps
                                      </h6>
                                      <ExpandableText
                                        text={dietPlan.reasoning}
                                        maxLines={2}
                                        className="text-sm text-neutral-600"
                                      />
                                    </div>
                                  )}
                                  
                                  {dietPlan.specific_foods && Array.isArray(dietPlan.specific_foods) && dietPlan.specific_foods.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Foods to Include
                                      </h6>
                                      <div className="flex flex-wrap gap-1">
                                        {dietPlan.specific_foods.map((food: string, idx: number) => (
                                          <span key={idx} className="inline-block px-2 py-1 bg-emerald-50 rounded text-xs text-emerald-700">
                                            {food}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {dietPlan.foods_to_avoid && Array.isArray(dietPlan.foods_to_avoid) && dietPlan.foods_to_avoid.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Foods to Avoid
                                      </h6>
                                      <div className="flex flex-wrap gap-1">
                                        {dietPlan.foods_to_avoid.map((food: string, idx: number) => (
                                          <span key={idx} className="inline-block px-2 py-1 bg-red-50 rounded text-xs text-red-700">
                                            {food}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dietPlan.target_biomarkers && Array.isArray(dietPlan.target_biomarkers) && dietPlan.target_biomarkers.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <Target className="h-3 w-3 mr-1" />
                                        Target biomarkers
                                      </h6>
                                      <div className="flex flex-wrap gap-1">
                                        {dietPlan.target_biomarkers.map((biomarker: string, idx: number) => (
                                          <span key={idx} className="inline-block px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                                            {biomarker}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(dietPlan.implementation || dietPlan.implementation_guidance) && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        How to Implement
                                      </h6>
                                      <div className="space-y-2">
                                        {(dietPlan.implementation || dietPlan.implementation_guidance)
                                          .split(';')
                                          .filter((item: string) => item.trim())
                                          .map((item: string, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2">
                                              <span className="text-primary-600 mt-0.5">•</span>
                                              <p className="text-sm text-neutral-600 flex-1">{item.trim()}</p>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {dietPlan.implementation_steps && Array.isArray(dietPlan.implementation_steps) && dietPlan.implementation_steps.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Implementation Steps
                                      </h6>
                                      <ol className="list-decimal list-inside text-sm text-neutral-600 space-y-1 ml-2">
                                        {dietPlan.implementation_steps.map((step: string, stepIdx: number) => (
                                          <li key={stepIdx}>{step}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}

                                  {dietPlan.expected_timeline && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Expected Timeline
                                      </h6>
                                      <div className="space-y-1">
                                        {dietPlan.expected_timeline
                                          .split(';')
                                          .filter((item: string) => item.trim())
                                          .map((item: string, idx: number) => (
                                            <p key={idx} className="text-sm text-neutral-600">{item.trim()}</p>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {(dietPlan.portion_guidelines || dietPlan.portion_guidance) && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <Info className="h-3 w-3 mr-1" />
                                        Portion Guidance
                                        <div className="ml-2 relative group">
                                          <Info className="h-3.5 w-3.5 text-neutral-400 cursor-help" />
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 z-10">
                                            <ExpandableText
                                              text={dietPlan.portion_guidelines || dietPlan.portion_guidance}
                                              maxLines={4}
                                              className="text-white"
                                              expandText="Show more"
                                              collapseText="Show less"
                                            />
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                                          </div>
                                        </div>
                                      </h6>
                                      <div className="space-y-1">
                                        {(dietPlan.portion_guidelines || dietPlan.portion_guidance)
                                          .split(';')
                                          .filter((item: string) => item.trim())
                                          .slice(0, 2)
                                          .map((item: string, idx: number) => (
                                            <p key={idx} className="text-sm text-neutral-600">{item.trim()}</p>
                                          ))}
                                        {(dietPlan.portion_guidelines || dietPlan.portion_guidance)
                                          .split(';')
                                          .filter((item: string) => item.trim()).length > 2 && (
                                            <p className="text-xs text-primary-600 italic">
                                              +{(dietPlan.portion_guidelines || dietPlan.portion_guidance)
                                                .split(';')
                                                .filter((item: string) => item.trim()).length - 2} more (hover over info icon for details)
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                  {dietPlan.expected_improvements && (
                                    <div className="pt-3 border-t border-neutral-100">
                                      <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Expected improvements
                                      </h6>
                                      <ExpandableText
                                        text={dietPlan.expected_improvements}
                                        maxLines={2}
                                        className="text-sm text-neutral-600"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Utensils className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No diet recommendations available</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'lifestyle' && (
                <div className="space-y-6">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-medium text-neutral-800">
                        Lifestyle Plan
                      </h3>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    
                    {lifestyle && lifestyle.length > 0 ? (
                      <div className="space-y-6">
                        {/* Check if new structure (array of objects) */}
                        {Array.isArray(lifestyle) && 
                         lifestyle.length > 0 &&
                         typeof lifestyle[0] === 'object' && 
                         lifestyle[0].specific_recommendation ? (
                          // New structure with detailed objects
                          (() => {
                            return (
                              <div>
                                {/* Lifestyle Content */}
                                <div className="space-y-4">
                                  {lifestyle.map((item: any, index: number) => {
                                    const category = item.category?.toLowerCase() || 'lifestyle'
                                    const Icon = getLifestyleCategoryIcon(category)
                                    const cardId = `lifestyle-${index}`
                                    const isExpanded = expandedDetails.lifestyleCards[cardId]
                                      
                                      return (
                                        <div key={cardId} className="border border-neutral-200 hover:border-neutral-300 rounded-lg transition-all duration-200">
                                          {/* Card Header - Always Visible */}
                                          <div 
                                            className="p-3 sm:p-4 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                            onClick={() => toggleLifestyleCard(cardId)}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                <div className="p-1.5 sm:p-2 rounded-full bg-neutral-100 flex-shrink-0">
                                                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <h4 className="text-sm sm:text-base font-medium text-neutral-800 capitalize">
                                                    {item.category || 'Lifestyle'}
                                                  </h4>
                                                  <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
                                                    {item.specific_recommendation}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                                {item.frequency && (
                                                  <span className="hidden sm:inline text-xs bg-white px-2 py-1 rounded border text-neutral-600 whitespace-nowrap">
                                                    {item.frequency}
                                                  </span>
                                                )}
                                                {isExpanded ? (
                                                  <ChevronUp className="h-4 w-4 text-neutral-400" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Expanded Content */}
                                          {isExpanded && (
                                            <div className="border-t border-neutral-200 p-4 bg-white space-y-4">
                                              <div>
                                                <ExpandableText
                                                  text={item.specific_recommendation}
                                                  maxLines={isMobile ? 3 : 5}
                                                  className="text-sm text-neutral-700 leading-relaxed"
                                                />
                                              </div>
                                              
                                              {item.frequency && (
                                                <div>
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                                    <Repeat className="h-3 w-3 mr-1" />
                                                    Frequency
                                                  </h6>
                                                  <p className="text-sm text-neutral-600">{item.frequency}</p>
                                                </div>
                                              )}
                                              
                                              {item.reasoning && (
                                                <div>
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Why this helps
                                                  </h6>
                                                  <ExpandableText
                                                    text={item.reasoning}
                                                    maxLines={2}
                                                    className="text-sm text-neutral-600"
                                                  />
                                                </div>
                                              )}
                                              
                                              {item.target_biomarkers && Array.isArray(item.target_biomarkers) && item.target_biomarkers.length > 0 && (
                                                <div>
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                                    <Target className="h-3 w-3 mr-1" />
                                                    Target biomarkers
                                                  </h6>
                                                  <div className="flex flex-wrap gap-1">
                                                    {item.target_biomarkers.map((biomarker: string, idx: number) => (
                                                      <span key={idx} className="inline-block px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                                                        {biomarker}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {item.implementation_steps && Array.isArray(item.implementation_steps) && item.implementation_steps.length > 0 && (
                                                <div>
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Implementation steps
                                                  </h6>
                                                  <ol className="list-decimal list-inside text-sm text-neutral-600 space-y-1 ml-2">
                                                    {item.implementation_steps.map((step: string, stepIdx: number) => (
                                                      <li key={stepIdx}>{step}</li>
                                                    ))}
                                                  </ol>
                                                </div>
                                              )}
                                              
                                              {item.expected_benefits && (
                                                <div className="pt-3 border-t border-neutral-100">
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                    Expected benefits
                                                  </h6>
                                                  <ExpandableText
                                                    text={item.expected_benefits}
                                                    maxLines={2}
                                                    className="text-sm text-neutral-600"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          // Legacy structure (array of strings)
                          <div className="space-y-4">
                            <h4 className="font-medium text-neutral-800 mb-4 flex items-center">
                              <Leaf className="h-5 w-5 text-teal-600 mr-2" />
                              Lifestyle Recommendations
                            </h4>
                            <div className="grid gap-3">
                              {lifestyle.map((item: any, index: number) => (
                                <div key={index} className="flex items-start space-x-3 p-4 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors">
                                  <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-neutral-700 text-sm">{typeof item === 'string' ? item : item.specific_recommendation || item.recommendation_title || ''}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                          <div className="text-sm text-neutral-600">
                            {Array.isArray(lifestyle) ? 
                              `${lifestyle.length} lifestyle recommendations` :
                              'Lifestyle guidance available'
                            }
                          </div>
                          <div className="flex space-x-3">
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Create Schedule
                            </Button>
                            <Button size="sm">
                              Track Progress
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Leaf className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No lifestyle recommendations available</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'workout' && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-medium text-neutral-800 flex items-center">
                        <Dumbbell className="h-5 w-5 text-primary-600 mr-2" />
                        Workout Plan
                      </h3>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    
                    {workout && workout.length > 0 ? (
                      <div className="space-y-4">
                        {workout.map((session: any, index: number) => {
                          const workoutCardId = `workout-${index}`
                          const isExpanded = expandedDetails.lifestyleCards[workoutCardId]
                          
                          // Build subtitle from available info
                          const subtitleParts: string[] = []
                          if (session.day_of_week) subtitleParts.push(session.day_of_week)
                          if (session.frequency_per_week) subtitleParts.push(`${session.frequency_per_week}x/week`)
                          if (session.duration_minutes) subtitleParts.push(`${session.duration_minutes} min`)
                          const subtitle = subtitleParts.join(' • ') || 'Workout session'
                          
                          return (
                            <Card key={index} className="border border-neutral-200 hover:border-neutral-300 transition-all">
                              {/* Card Header - Always Visible */}
                              <div 
                                className="p-4 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                onClick={() => {
                                  setExpandedDetails(prev => ({
                                    ...prev,
                                    lifestyleCards: {
                                      ...prev.lifestyleCards,
                                      [workoutCardId]: !prev.lifestyleCards[workoutCardId]
                                    }
                                  }))
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-full bg-primary-100 flex-shrink-0">
                                      <Dumbbell className="h-4 w-4 text-primary-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="text-base font-semibold text-neutral-800">
                                          {session.exercise_type || `Workout Session ${index + 1}`}
                                        </h4>
                                        {session.priority && (
                                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            session.priority === 'essential' ? 'bg-primary-50 text-primary-700' :
                                            session.priority === 'beneficial' ? 'bg-sage-50 text-sage-700' :
                                            'bg-neutral-50 text-neutral-700'
                                          }`}>
                                            {session.priority.toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-neutral-600">{subtitle}</p>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Reasoning Preview - Always Visible */}
                                {session.reasoning && (
                                  <div className="mt-3">
                                    <ExpandableText
                                      text={session.reasoning}
                                      maxLines={2}
                                      className="text-xs text-neutral-600 leading-relaxed"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="border-t border-neutral-200 p-4 bg-white space-y-4">
                                  {/* Exercises */}
                                  {session.specific_exercises && Array.isArray(session.specific_exercises) && session.specific_exercises.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2">Exercises</h6>
                                      <div className="flex flex-wrap gap-1.5">
                                        {session.specific_exercises.map((exercise: string, idx: number) => (
                                          <span key={idx} className="inline-block px-2 py-1 bg-primary-50 rounded text-xs text-primary-700">
                                            {exercise}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Workout Details Grid */}
                                  {(session.intensity || session.duration_minutes || session.frequency_per_week || session.rest_days_between) && (
                                    <div className="grid grid-cols-2 gap-4">
                                      {session.intensity && (
                                        <div>
                                          <p className="text-xs text-neutral-600 mb-1">Intensity</p>
                                          <p className="text-sm font-medium text-neutral-800 capitalize">{session.intensity}</p>
                                        </div>
                                      )}
                                      {session.duration_minutes && (
                                        <div>
                                          <p className="text-xs text-neutral-600 mb-1">Duration</p>
                                          <p className="text-sm font-medium text-neutral-800">{session.duration_minutes} min</p>
                                        </div>
                                      )}
                                      {session.frequency_per_week && (
                                        <div>
                                          <p className="text-xs text-neutral-600 mb-1">Frequency</p>
                                          <p className="text-sm font-medium text-neutral-800">{session.frequency_per_week}x/week</p>
                                        </div>
                                      )}
                                      {session.rest_days_between && (
                                        <div>
                                          <p className="text-xs text-neutral-600 mb-1">Rest Days</p>
                                          <p className="text-sm font-medium text-neutral-800">{session.rest_days_between} days</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Progression Plan */}
                                  {session.progression_plan && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-1">Progression Plan</h6>
                                      <ExpandableText
                                        text={session.progression_plan}
                                        maxLines={isMobile ? 3 : 4}
                                        className="text-sm text-neutral-600"
                                      />
                                    </div>
                                  )}

                                  {/* Target Biomarkers */}
                                  {session.target_biomarkers && Array.isArray(session.target_biomarkers) && session.target_biomarkers.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <Target className="h-3 w-3 mr-1" />
                                        Target Biomarkers
                                      </h6>
                                      <div className="flex flex-wrap gap-1.5">
                                        {session.target_biomarkers.map((biomarker: string, idx: number) => (
                                          <span key={idx} className="inline-block px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                                            {biomarker}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Safety Considerations */}
                                  {session.safety_considerations && Array.isArray(session.safety_considerations) && session.safety_considerations.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-neutral-800 text-sm mb-2 flex items-center">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Safety Considerations
                                      </h6>
                                      <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 ml-2">
                                        {session.safety_considerations.map((consideration: string, idx: number) => (
                                          <li key={idx}>{consideration}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Expected Improvements */}
                                  {session.expected_improvements && (
                                    <div className="pt-3 border-t border-neutral-100">
                                      <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Expected Improvements
                                      </h6>
                                      <ExpandableText
                                        text={session.expected_improvements}
                                        maxLines={isMobile ? 3 : 4}
                                        className="text-sm text-neutral-600"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Dumbbell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No workout recommendations available</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'causes' && (
                <div className="space-y-6">
                  {analysis.root_causes && Array.isArray(analysis.root_causes) && analysis.root_causes.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-xl font-medium text-neutral-800 mb-6">
                        Potential Root Causes
                      </h3>
                      <div className="space-y-4">
                        {analysis.root_causes.map((cause: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-lg border">
                            <div className="bg-primary-100 p-2 rounded-full">
                              <Brain className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-neutral-800">
                                  {cause.category}
                                </h4>
                                {cause.priority && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    cause.priority === 'high' ? 'bg-red-50 text-red-700' :
                                    cause.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {cause.priority.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mb-2">
                                {cause.description}
                              </p>
                              {cause.affected_biomarkers && Array.isArray(cause.affected_biomarkers) && cause.affected_biomarkers.length > 0 && (
                                <div className="text-xs text-neutral-500 mb-2">
                                  Affects: {cause.affected_biomarkers.join(', ')}
                                </div>
                              )}
                              {cause.intervention_approach && (
                                <div className="mt-3 pt-3 border-t border-neutral-200">
                                  <h5 className="text-xs font-semibold text-neutral-800 mb-1">Intervention Approach</h5>
                                  <p className="text-sm text-neutral-600 leading-relaxed">{cause.intervention_approach}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  {analysis.monitoring_plan && (
                    <Card className="p-6">
                      <h3 className="text-xl font-medium text-neutral-800 mb-6 flex items-center">
                        <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                        Monitoring Plan
                      </h3>
                      
                      <div className="space-y-6">
                        {analysis.monitoring_plan.retest_timeline && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800 mb-2">Retest Timeline</h4>
                            <p className="text-sm text-neutral-600 bg-primary-50 p-3 rounded-lg border border-primary-100">
                              {analysis.monitoring_plan.retest_timeline}
                            </p>
                          </div>
                        )}

                        {analysis.monitoring_plan.key_biomarkers_to_track && 
                         Array.isArray(analysis.monitoring_plan.key_biomarkers_to_track) &&
                         analysis.monitoring_plan.key_biomarkers_to_track.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800 mb-2">Key Biomarkers to Track</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.monitoring_plan.key_biomarkers_to_track.map((biomarker: string, index: number) => (
                                <span key={index} className="px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                                  {biomarker}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.monitoring_plan.symptoms_to_monitor && 
                         Array.isArray(analysis.monitoring_plan.symptoms_to_monitor) &&
                         analysis.monitoring_plan.symptoms_to_monitor.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800 mb-2">Symptoms to Monitor</h4>
                            <div className="space-y-2">
                              {analysis.monitoring_plan.symptoms_to_monitor.map((symptom: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-neutral-700">{symptom}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.monitoring_plan.success_metrics && 
                         Array.isArray(analysis.monitoring_plan.success_metrics) &&
                         analysis.monitoring_plan.success_metrics.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-800 mb-2">Success Metrics</h4>
                            <div className="space-y-2">
                              {analysis.monitoring_plan.success_metrics.map((metric: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <CheckCircle className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-neutral-700">{metric}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Score Overview */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
            >
              <Card className={`p-4 ${getHealthScoreBackground(analysis.overall_health_score)} border`}>
                <div className="text-center space-y-3">
                  <div className="bg-white p-3 rounded-full shadow-sm border mx-auto w-fit">
                    <div className={`text-2xl font-light ${getHealthScoreColor(analysis.overall_health_score)}`}>
                      {analysis.overall_health_score}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-800 mb-1">
                      Wellness Score
                    </h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.health_category)}`}>
                      {analysis.health_category?.toUpperCase() || 'UNKNOWN'} HEALTH
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('supplements')}
                    className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left w-full"
                  >
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Pill className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800 text-sm">View Supplements</div>
                      <div className="text-xs text-neutral-600">
                        {supplements.length} recommendations
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('lifestyle')}
                    className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left w-full"
                  >
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Heart className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800 text-sm">Lifestyle Plan</div>
                      <div className="text-xs text-neutral-600">
                        {lifestyle.length} recommendations
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('biomarkers')}
                    className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left w-full"
                  >
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Activity className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800 text-sm">Detailed Analysis</div>
                      <div className="text-xs text-neutral-600">
                        {analysis.biomarker_insights?.length || 0} biomarkers analyzed
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Future: Implement reminder functionality
                    }}
                    className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left w-full"
                  >
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Bell className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800 text-sm">Create Reminders</div>
                      <div className="text-xs text-neutral-600">
                        Set up reminders
                      </div>
                    </div>
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Analysis Details */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-6">
                  Analysis Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Processing Time</span>
                    <span className="text-neutral-800">{formatProcessingTime(analysis.processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Evidence Quality</span>
                    <span className="text-neutral-800 capitalize">
                      {analysis.evidence_summary?.confidence_level || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Limitations</span>
                    <span className="text-neutral-800">
                      {analysis.evidence_summary?.limitations?.length || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        {/* Disclaimers - Full Width */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-6 bg-neutral-100">
            <h4 className="font-medium text-sm text-neutral-800 mb-4 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Important Medical Disclaimers
            </h4>
            <div className="space-y-4">
              {/* Static Medical Disclaimers */}
              <div className="space-y-2 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-800 mb-2">Important Medical Information:</p>
                <ul className="space-y-1.5 list-none">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>This analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Never disregard professional medical advice or delay in seeking it because of something you have read in this analysis.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>If you think you may have a medical emergency, call your doctor or emergency services immediately.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Individual results may vary. The recommendations provided are based on general guidelines and may not be appropriate for everyone.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Consult with a healthcare professional before starting any new supplement, diet, or exercise program, especially if you have pre-existing medical conditions or are taking medications.</span>
                  </li>
                </ul>
              </div>
              
              {/* Analysis-Specific Disclaimers (if any) */}
              {analysis.disclaimers && Array.isArray(analysis.disclaimers) && analysis.disclaimers.length > 0 && (
                <div className="pt-4 border-t border-neutral-200">
                  <p className="font-semibold text-neutral-800 mb-2 text-xs">Additional Notes:</p>
                  <div className="space-y-1 text-xs text-neutral-600">
                    {analysis.disclaimers.map((disclaimer: string, index: number) => (
                      <p key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{disclaimer}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 