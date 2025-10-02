'use client'

import { useState, useEffect } from 'react'
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
import { HealthAnalysis } from '@/lib/supabase'
import { formatProcessingTime } from '@/lib/utils'

interface AnalysisPageProps {
  params: Promise<{ id: string }>
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { user, session } = useAuth()
  const router = useRouter()
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
      } finally {
        setLoading(false)
      }
    }

    if (user && analysisId && session) {
      fetchAnalysis()
    }
  }, [analysisId, user, session])

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

  // Helper function to sort biomarkers by status priority
  const getStatusPriority = (status: string | null | undefined) => {
    switch (status) {
      case 'deficient': return 1
      case 'concerning': return 2
      case 'suboptimal': return 3
      case 'optimal': return 4
      case null:
      case undefined:
      case 'unknown':
      default: return 5
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
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
    { id: 'causes', label: 'Root Causes', icon: Brain }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-light text-neutral-800">
                  Health Analysis Results
                </h1>
                <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Analysis #{analysis.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <Card className="p-1">
                <div className="flex space-x-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Health Score Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-light text-red-600">
                            {analysis.biomarker_insights?.filter((b: any) => b.status === 'deficient').length || 0}
                          </div>
                          <div className="text-sm text-neutral-600">Priority Issues</div>
                        </div>
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-4 border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-light text-emerald-600">
                            {analysis.biomarker_insights?.filter((b: any) => b.status === 'optimal').length || 0}
                          </div>
                          <div className="text-sm text-neutral-600">Optimal</div>
                        </div>
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-4 border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-light text-neutral-800">
                            {((analysis.recommendations_summary?.supplements?.length || 0) + 
                              (analysis.recommendations_summary?.essential?.length || 0) + 
                              (analysis.recommendations_summary?.beneficial?.length || 0) +
                              (analysis.recommendations_summary?.lifestyle?.length || 0))}
                          </div>
                          <div className="text-sm text-neutral-600">Recommendations</div>
                        </div>
                        <Heart className="h-6 w-6 text-neutral-500" />
                      </div>
                    </Card>
                  </div>

                  {/* Key Insights */}
                  <Card className="p-6">
                    <h3 className="text-xl font-medium text-neutral-800 mb-6">Key Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Priority Actions */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-neutral-800 flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          Priority Actions
                        </h4>
                        <div className="space-y-2">
                          {analysis.biomarker_insights
                            ?.filter((insight: any) => insight.status === 'deficient')
                            .slice(0, 3)
                            .map((insight: any, index: number) => (
                              <div key={index} className="flex items-center space-x-3 p-2 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                <div className="text-sm font-medium text-neutral-800">
                                  {insight.biomarker_name || insight.biomarker}
                                </div>
                              </div>
                            ))}
                          {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'deficient').length === 0 && (
                            <div className="text-sm text-neutral-500 italic">No critical issues found</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Optimal Biomarkers */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-neutral-800 flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                          Optimal Biomarkers
                        </h4>
                        <div className="space-y-2">
                          {analysis.biomarker_insights
                            ?.filter((insight: any) => insight.status === 'optimal')
                            .slice(0, 3)
                            .map((insight: any, index: number) => (
                              <div key={index} className="flex items-center space-x-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                <div className="text-sm font-medium text-neutral-800">
                                  {insight.biomarker_name || insight.biomarker}
                                </div>
                              </div>
                            ))}
                          {analysis.biomarker_insights?.filter((insight: any) => insight.status === 'optimal').length === 0 && (
                            <div className="text-sm text-neutral-500 italic">No optimal biomarkers found</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                  

                  

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
                        
                        console.log('Processing reading:', {
                          index,
                          biomarkerName,
                          hasBiomarkerLink: !!reading.biomarkers,
                          readingKeys: Object.keys(reading),
                          value: reading.value,
                          unit: reading.unit,
                          status: reading.status
                        })
                        
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
                          
                          // Enrichment from insight (if available)
                          ...(insight && {
                            // Add insight data but prioritize reading data
                            clinical_significance: insight.clinical_significance,
                            functional_medicine_perspective: insight.functional_medicine_perspective,
                            interpretation: insight.interpretation,
                            recommendations: insight.recommendations
                          })
                        }
                        
                        allBiomarkers.push(enrichedBiomarker)
                      })
                    } else {
                      // Fallback: if no biomarker_readings, use insights only
                      console.warn('No biomarker_readings found, falling back to insights only')
                      analysis.biomarker_insights?.forEach((insight: any) => {
                        allBiomarkers.push({ 
                          ...insight, 
                          hasInsight: true,
                          biomarkerData: null
                        })
                      })
                    }
                    
                    console.log('Debug: Total biomarkers collected:', allBiomarkers.length)
                    console.log('Debug: Biomarkers from readings:', allBiomarkers.map(b => ({
                      name: b.biomarker_name || b.biomarker,
                      status: b.status,
                      hasInsight: b.hasInsight,
                      value: b.current_value || b.value,
                      unit: b.unit
                    })))

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
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
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
                                        // Sort by data quality: full data first, then limited data, then no analysis
                                        const aScore = a.hasBiomarkerData && a.hasInsight ? 3 : 
                                                      a.hasBiomarkerData ? 2 : 
                                                      a.hasInsight ? 1 : 0
                                        const bScore = b.hasBiomarkerData && b.hasInsight ? 3 : 
                                                      b.hasBiomarkerData ? 2 : 
                                                      b.hasInsight ? 1 : 0
                                        
                                        // Higher score first (better data quality)
                                        if (aScore !== bScore) {
                                          return bScore - aScore
                                        }
                                        
                                        // If same data quality, sort alphabetically by name
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
                                                  {!insight.hasBiomarkerData && (
                                                    <span className="inline-block mt-1 text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded">
                                                      Limited Data
                                                    </span>
                                                  )}
                                                  {!insight.hasInsight && insight.hasBiomarkerData && (
                                                    <span className="inline-block mt-1 text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded">
                                                      No Analysis
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
                                              
                                              {/* Optimal Range Section */}
                                              {optimalRanges.length > 0 && (
                                                <div className="min-h-[20px] flex items-start justify-between gap-3">
                                                  <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Optimal Range</span>
                                                  <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">
                                                    {(() => {
                                                      const primaryRange = optimalRanges.find((r: any) => r.is_primary) || optimalRanges[0]
                                                      return `${formatRangeValue(primaryRange.optimal_min, insight.unit)} - ${formatRangeValue(primaryRange.optimal_max, insight.unit)}`
                                                    })()}
                                                  </span>
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
                                                {/* Description */}
                                                {biomarkerDetails?.description && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">What is this?</h5>
                                                    <p className="text-xs text-neutral-600 leading-relaxed">{biomarkerDetails.description}</p>
                                                  </div>
                                                )}

                                                {/* Clinical Significance */}
                                                {(biomarkerDetails?.clinical_significance || insight.hasInsight) && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Clinical Significance</h5>
                                                    <p className="text-xs text-neutral-600 leading-relaxed">
                                                      {biomarkerDetails?.clinical_significance || 
                                                       insight.clinical_significance || 
                                                       insight.functional_medicine_perspective || 
                                                       insight.interpretation ||
                                                       'Clinical significance information not available for this biomarker.'}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Recommendations */}
                                                {(insight.hasInsight && insight.recommendations && insight.recommendations.length > 0) && (
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-neutral-800 mb-2">Recommendations</h5>
                                                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1 ml-2">
                                                      {insight.recommendations.slice(0, 3).map((rec: string, recIndex: number) => (
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
                  {analysis.recommendations_summary.supplements && analysis.recommendations_summary.supplements.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Priority Navigation */}
                      <div className="lg:col-span-1 order-2 lg:order-1">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Card className="p-4 sticky top-6">
                            <h4 className="text-sm font-medium text-neutral-800 mb-3">Priority Levels</h4>
                            <div className="space-y-2">
                              {['essential', 'beneficial', 'optional'].map((priority) => {
                                const supplements = analysis.recommendations_summary.supplements.filter((rec: any) => rec.priority === priority)
                                if (supplements.length === 0) return null
                                
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
                                      {supplements.length}
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
                          const supplements = analysis.recommendations_summary.supplements.filter((rec: any) => rec.priority === activeSupplementTab)
                          
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
                              {supplements.map((supplement: any, index: number) => (
                                <Card key={index} className={`group hover:shadow-lg transition-all duration-300 ${config.borderColor} bg-white flex flex-col h-full`}>
                                  {/* Card Header */}
                                  <div className="p-1 flex-grow">
                                    <div className="mb-4 min-h-[60px] flex flex-col justify-start">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 pr-2">
                                          <h4 className="text-base font-semibold text-neutral-800 leading-tight">
                                            {(() => {
                                              const name = supplement.name || '';
                                              const match = name.match(/^([^(]+)(\(.+\))?$/);
                                              if (match) {
                                                const [, mainName] = match;
                                                return mainName.trim();
                                              }
                                              return name;
                                            })()}
                                          </h4>
                                        </div>
                                        <div className="flex-shrink-0 ml-3 text-right">
                                          <span 
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${config.badgeColor} whitespace-nowrap relative group/badge cursor-help flex items-center gap-1`}
                                            title={(() => {
                                              const durationText = supplement.duration || '';
                                              // Replace "then" with "(" and add closing parenthesis
                                              const formattedText = durationText.replace(' then ', ' (') + (durationText.includes(' then ') ? ')' : '');
                                              const parts = formattedText.split(' (');
                                              if (parts.length > 1) {
                                                const popupText = parts[1].replace(')', '');
                                                return popupText.charAt(0).toUpperCase() + popupText.slice(1);
                                              }
                                              return '';
                                            })()}
                                          >
                                            <span>
                                              {(() => {
                                                const durationText = supplement.duration || '';
                                                // Replace "then" with "(" and add closing parenthesis
                                                const formattedText = durationText.replace(' then ', ' (') + (durationText.includes(' then ') ? ')' : '');
                                                const parts = formattedText.split(' (');
                                                return parts[0];
                                              })()}
                                            </span>
                                            {(() => {
                                              const durationText = supplement.duration || '';
                                              const parts = durationText.split(' then ');
                                              if (parts.length > 1) {
                                                return <Repeat className="h-2.5 w-2.5 opacity-70" />;
                                              }
                                              return null;
                                            })()}
                                            {(() => {
                                              const durationText = supplement.duration || '';
                                              // Replace "then" with "(" and add closing parenthesis
                                              const formattedText = durationText.replace(' then ', ' (') + (durationText.includes(' then ') ? ')' : '');
                                              const parts = formattedText.split(' (');
                                              if (parts.length > 1) {
                                                return (
                                                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 ${config.badgeColor} bg-opacity-95 backdrop-blur-sm text-xs font-medium rounded-full shadow-lg border border-white border-opacity-20 whitespace-nowrap opacity-0 group-hover/badge:opacity-100 scale-95 group-hover/badge:scale-100 translate-y-1 group-hover/badge:translate-y-0 transition-all duration-300 ease-out pointer-events-none z-20`}>
                                                     {(() => {
                                                       const popupText = parts[1].replace(')', '');
                                                       return popupText.charAt(0).toUpperCase() + popupText.slice(1);
                                                     })()}
                                                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent ${
                                                      config.badgeColor.includes('primary-50') ? 'border-t-primary-50' :
                                                      config.badgeColor.includes('sage-50') ? 'border-t-sage-50' : 'border-t-neutral-50'
                                                    } opacity-95`}></div>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="min-h-[16px] flex items-start">
                                        {(() => {
                                          const name = supplement.name || '';
                                          const match = name.match(/^([^(]+)(\(.+\))?$/);
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
                                    
                                    {/* Quick Info */}
                                    <div className="space-y-3">
                                      <div className="min-h-[32px] flex items-start justify-between gap-3">
                                        <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Dosage</span>
                                        <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">{supplement.dosage}</span>
                                      </div>
                                      <div className="min-h-[48px] flex flex-col justify-start">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                          <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Timing</span>
                                          <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed capitalize">
                                            {(() => {
                                              const timing = supplement.timing || '';
                                              const match = timing.match(/^([^(]+)(\(.+\))?$/);
                                              if (match) {
                                                const [, mainTiming] = match;
                                                return mainTiming.trim();
                                              }
                                              return timing;
                                            })()}
                                          </span>
                                        </div>
                                        <div className="min-h-[16px] flex items-start">
                                          {(() => {
                                            const timing = supplement.timing || '';
                                            const match = timing.match(/^([^(]+)(\(.+\))?$/);
                                            if (match && match[2]) {
                                              return (
                                                <div className="text-xs font-normal text-neutral-500 normal-case">
                                                  {match[2]}
                                                </div>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      </div>
                                      <div className="min-h-[20px] flex items-start justify-between gap-3">
                                        <span className="text-neutral-500 text-xs font-medium flex-shrink-0">Frequency</span>
                                        <span className="font-medium text-neutral-700 text-xs text-right leading-relaxed">{supplement.frequency}</span>
                                      </div>
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
                                        {/* Why This Helps */}
                                        <div>
                                          <h5 className="text-xs font-semibold text-neutral-800 mb-2">Benefits</h5>
                                          <p className="text-xs text-neutral-600 leading-relaxed">{supplement.reasoning}</p>
                                        </div>
                                        
                                        {/* Target Biomarkers */}
                                        {supplement.target_biomarkers && supplement.target_biomarkers.length > 0 && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2">Targets</h5>
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
                                        {supplement.expected_improvement && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2">Expected Results</h5>
                                            <p className="text-xs text-neutral-600 leading-relaxed">{supplement.expected_improvement}</p>
                                          </div>
                                        )}
                                        
                                        {/* Safety Information */}
                                        {(supplement.contraindications || supplement.drug_interactions || supplement.monitoring) && (
                                          <div className="pt-3 border-t border-neutral-100">
                                            <h5 className="text-xs font-semibold text-neutral-800 mb-2 flex items-center">
                                              <Shield className="h-3 w-3 mr-1.5" />
                                              Safety Notes
                                            </h5>
                                            <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
                                              {supplement.contraindications && supplement.contraindications.length > 0 && (
                                                <div>
                                                  <span className="font-semibold">Avoid if: </span>
                                                  <span>{supplement.contraindications.join(', ')}</span>
                                                </div>
                                              )}
                                              {supplement.drug_interactions && supplement.drug_interactions.length > 0 && (
                                                <div>
                                                  <span className="font-semibold">Drug interactions: </span>
                                                  <span>{supplement.drug_interactions.join(', ')}</span>
                                                </div>
                                              )}
                                              {supplement.monitoring && (
                                                <div>
                                                  <span className="font-semibold">Monitor: </span>
                                                  <span>{supplement.monitoring}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      
                                      </div>
                                    </details>
                                  </div>
                                </Card>
                              ))}
                              </div>
                              
                              {/* Action Section */}
                              <div className="text-center space-y-6 pt-8 border-t border-neutral-100">
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium text-neutral-800">Ready to get started?</h3>
                                  <p className="text-neutral-500">
                                    Total of {analysis.recommendations_summary.supplements.length} personalized recommendations
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

              {activeTab === 'lifestyle' && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-medium text-neutral-800">
                        Lifestyle Optimization Plan
                      </h3>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Plan
                      </Button>
                    </div>
                    
                    {analysis.recommendations_summary.lifestyle && analysis.recommendations_summary.lifestyle.length > 0 ? (
                      <div className="space-y-6">
                        {/* Check if new structure (array of objects) */}
                        {Array.isArray(analysis.recommendations_summary.lifestyle) && 
                         analysis.recommendations_summary.lifestyle.length > 0 &&
                         typeof analysis.recommendations_summary.lifestyle[0] === 'object' && 
                         analysis.recommendations_summary.lifestyle[0].specific_recommendation ? (
                          // New structure with detailed objects
                          (() => {
                            const dynamicCategories = getDynamicLifestyleCategories(analysis.recommendations_summary.lifestyle)
                            const lifestyleTabs = [
                              { id: 'all', label: 'All', icon: Heart, count: analysis.recommendations_summary.lifestyle.length }
                            ]
                            
                            // Add dynamic category tabs based on actual data
                            dynamicCategories.forEach((recs, category) => {
                              if (recs.length > 0) {
                                lifestyleTabs.push({
                                  id: category,
                                  label: formatCategoryName(category),
                                  icon: getLifestyleCategoryIcon(category),
                                  count: recs.length
                                })
                              }
                            })

                            return (
                              <div>
                                {/* Lifestyle Sub-tabs */}
                                <div className="mb-6">
                                  <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-lg">
                                    {lifestyleTabs.map((tab) => {
                                      const Icon = tab.icon
                                      return (
                                        <button
                                          key={tab.id}
                                          onClick={() => setActiveLifestyleTab(tab.id)}
                                          className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-sm transition-colors flex-shrink-0 ${
                                            activeLifestyleTab === tab.id
                                              ? 'bg-white text-neutral-800 shadow-sm border border-neutral-200'
                                              : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200/50'
                                          }`}
                                        >
                                          <Icon className="h-4 w-4" />
                                          <span>{tab.label}</span>
                                          {tab.count > 0 && tab.id !== 'all' && (
                                            <span className="text-xs bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-full">
                                              {tab.count}
                                            </span>
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Lifestyle Content */}
                                <div className="space-y-4">
                                  {(() => {
                                    let recommendationsToShow = analysis.recommendations_summary.lifestyle
                                    
                                    if (activeLifestyleTab !== 'all') {
                                      recommendationsToShow = dynamicCategories.get(activeLifestyleTab) || []
                                    }

                                    return recommendationsToShow.map((item: any, index: number) => {
                                      const category = item.category?.toLowerCase() || 'lifestyle'
                                      const Icon = getLifestyleCategoryIcon(category)
                                      const cardId = `${activeLifestyleTab}-${index}`
                                      const isExpanded = expandedDetails.lifestyleCards[cardId]
                                      
                                      return (
                                        <div key={cardId} className="border border-neutral-200 hover:border-neutral-300 rounded-lg transition-all duration-200">
                                          {/* Card Header - Always Visible */}
                                          <div 
                                            className="p-4 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                            onClick={() => toggleLifestyleCard(cardId)}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-full bg-neutral-100">
                                                  <Icon className="h-4 w-4 text-neutral-600" />
                                                </div>
                                                <div>
                                                  <h4 className="font-medium text-neutral-800 capitalize">
                                                    {item.category || 'Lifestyle'}
                                                  </h4>
                                                  <p className="text-sm text-neutral-600 truncate">
                                                    {item.specific_recommendation?.length > 80 
                                                      ? `${item.specific_recommendation.substring(0, 80)}...`
                                                      : item.specific_recommendation
                                                    }
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                {item.frequency && (
                                                  <span className="text-xs bg-white px-2 py-1 rounded border text-neutral-600">
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
                                                <p className="text-neutral-700 leading-relaxed">
                                                  {item.specific_recommendation}
                                                </p>
                                              </div>
                                              
                                              {item.reasoning && (
                                                <div>
                                                  <h6 className="font-medium text-neutral-800 text-sm mb-1 flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Why this helps
                                                  </h6>
                                                  <p className="text-sm text-neutral-600">{item.reasoning}</p>
                                                </div>
                                              )}
                                              
                                              {item.target_biomarkers && item.target_biomarkers.length > 0 && (
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
                                              
                                              {item.implementation_steps && item.implementation_steps.length > 0 && (
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
                                                  <p className="text-sm text-neutral-600">{item.expected_benefits}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })
                                  })()}
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
                              {analysis.recommendations_summary.lifestyle.map((item: string, index: number) => (
                                <div key={index} className="flex items-start space-x-3 p-4 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors">
                                  <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-neutral-700 text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                          <div className="text-sm text-neutral-600">
                            {Array.isArray(analysis.recommendations_summary.lifestyle) ? 
                              `${analysis.recommendations_summary.lifestyle.length} lifestyle recommendations` :
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

              {activeTab === 'causes' && (
                <div className="space-y-6">
                  {analysis.root_causes && analysis.root_causes.length > 0 && (
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
                              <h4 className="font-medium text-neutral-800 mb-1">
                                {cause.category}
                              </h4>
                              <p className="text-sm text-neutral-600 mb-2">
                                {cause.description}
                              </p>
                              <div className="text-xs text-neutral-500">
                                Affects: {cause.affected_biomarkers.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
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
                        {((analysis.recommendations_summary?.supplements?.length || 0) + 
                          (analysis.recommendations_summary?.essential?.length || 0) + 
                          (analysis.recommendations_summary?.beneficial?.length || 0))} recommendations
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
                        {analysis.recommendations_summary?.lifestyle?.length || 0} recommendations
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
                      console.log('Create reminder clicked')
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
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
                      {analysis.evidence_summary.confidence_level}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">References</span>
                    <span className="text-neutral-800">
                      {analysis.evidence_summary.total_references}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        {/* Disclaimers - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-6 bg-neutral-100">
            <h4 className="font-medium text-sm text-neutral-800 mb-4 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Important Medical Disclaimers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-neutral-600">
              {analysis.disclaimers.map((disclaimer: string, index: number) => (
                <p key={index}>• {disclaimer}</p>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 