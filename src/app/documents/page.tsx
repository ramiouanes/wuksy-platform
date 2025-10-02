'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  FileText, 
  Activity, 
  Calendar,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Upload,
  ArrowLeft,
  X,
  Zap,
  Cpu,
  Brain,
  FlaskConical,
  Pill,
  Apple,
  Dumbbell,
  Database,
  Save,
  ChevronDown
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@supabase/supabase-js'
import { DocumentWithBiomarkers, BiomarkerReading, HealthAnalysis } from '@/lib/supabase'

interface DocumentWithAnalysis extends DocumentWithBiomarkers {
  analysis?: HealthAnalysis
}

export default function DocumentsPage() {
  const { user, loading, session } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [analyzingDocuments, setAnalyzingDocuments] = useState<Set<string>>(new Set())
  const [analysisProgress, setAnalysisProgress] = useState<{[key: string]: number}>({})
  const [analysisStatus, setAnalysisStatus] = useState<{[key: string]: string}>({})
  const [analysisDetails, setAnalysisDetails] = useState<{[key: string]: any}>({})
  const [expandedReasoning, setExpandedReasoning] = useState<{[key: string]: boolean}>({})

  const [analysisAbortControllers, setAnalysisAbortControllers] = useState<{[key: string]: AbortController}>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && session) {
      fetchDocuments()
    }
  }, [user, session])

  const fetchDocuments = async () => {
    if (!session?.access_token) return

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      })

      // Fetch documents with their biomarker readings and analyses
      const { data: documentsData, error: documentsError } = await userSupabase
        .from('documents')
        .select(`
          *,
          biomarker_readings (
            id,
            biomarker_name,
            value,
            unit,
            category,
            reference_range,
            confidence,
            matched_from_db,
            status,
            severity
          )
        `)
        .eq('user_id', user!.id)
        .order('uploaded_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        return
      }

      // Fetch analyses for each document
      const documentIds = documentsData?.map(d => d.id) || []
      const { data: analysesData, error: analysesError } = await userSupabase
        .from('health_analyses')
        .select('*')
        .in('document_id', documentIds)

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError)
      }

      // Combine documents with their analyses
      const documentsWithAnalyses = documentsData?.map(doc => ({
        ...doc,
        biomarker_readings: doc.biomarker_readings || [],
        analysis: analysesData?.find(analysis => analysis.document_id === doc.id)
      })) || []

      setDocuments(documentsWithAnalyses)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startAnalysis = async (documentId: string) => {
    if (!session?.access_token) return
    
    // Create AbortController for this analysis
    const abortController = new AbortController()
    setAnalysisAbortControllers(prev => ({
      ...prev,
      [documentId]: abortController
    }))
    
    setAnalyzingDocuments(prev => new Set(prev).add(documentId))
    setAnalysisProgress(prev => ({ ...prev, [documentId]: 0 }))
    setAnalysisStatus(prev => ({ ...prev, [documentId]: 'Starting analysis...' }))
    setAnalysisDetails(prev => ({ ...prev, [documentId]: { stage: 'initializing' } }))
    
    try {
      const response = await fetch('/api/analysis/generate-streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/stream'
        },
        body: JSON.stringify({ documentId }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error('Failed to start analysis')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n').filter(line => line.trim())
            
            for (const line of lines) {
              try {
                const update = JSON.parse(line)
                console.log('Analysis update:', update.status, 'Details:', update.details)
                
                // Calculate progress based on the stage
                let progressPercentage = analysisProgress[documentId] || 0
                
                if (update.details?.stage) {
                  switch (update.details.stage) {
                    case 'initializing':
                      progressPercentage = 5
                      break
                    case 'biomarker_analysis':
                      progressPercentage = 25
                      break
                    case 'demographic_analysis':
                      progressPercentage = 35
                      break
                    case 'generating_insights':
                      progressPercentage = 50
                      break
                    case 'supplement_analysis':
                      progressPercentage = 65
                      break
                    case 'diet_analysis':
                      progressPercentage = 75
                      break
                    case 'lifestyle_analysis':
                      progressPercentage = 85
                      break
                    case 'saving':
                      progressPercentage = 90
                      break
                    case 'recommendations':
                      progressPercentage = 95
                      break
                    case 'biomarker_update':
                      progressPercentage = 98
                      break
                    case 'complete':
                      progressPercentage = 100
                      break
                    default:
                      // Incremental progress for unknown stages
                      progressPercentage = Math.min(progressPercentage + 5, 95)
                  }
                } else if (update.status.includes('comprehensive functional medicine analysis')) {
                  progressPercentage = 10
                } else if (update.status.includes('Saving')) {
                  progressPercentage = Math.max(progressPercentage, 90)
                } else if (update.status.includes('complete')) {
                  progressPercentage = 100
                } else {
                  // Small incremental progress for status updates without stage info
                  progressPercentage = Math.min(progressPercentage + 2, 95)
                }
                
                // Update progress and status
                setAnalysisProgress(prev => ({ ...prev, [documentId]: progressPercentage }))
                setAnalysisStatus(prev => ({ ...prev, [documentId]: update.status }))
                setAnalysisDetails(prev => ({ ...prev, [documentId]: update.details || {} }))
                
                // Check if analysis is complete
                if (update.status.includes('Analysis complete') || update.details?.stage === 'complete') {
                  // Clean up and refresh documents
                  setTimeout(() => {
                    setAnalysisAbortControllers(prev => {
                      const next = { ...prev }
                      delete next[documentId]
                      return next
                    })
                    
                    // Clean up progress tracking
                    setAnalysisProgress(prev => {
                      const next = { ...prev }
                      delete next[documentId]
                      return next
                    })
                    setAnalysisStatus(prev => {
                      const next = { ...prev }
                      delete next[documentId]
                      return next
                    })
                    setAnalysisDetails(prev => {
                      const next = { ...prev }
                      delete next[documentId]
                      return next
                    })
                    setExpandedReasoning(prev => {
                      const next = { ...prev }
                      delete next[documentId]
                      return next
                    })
                    
                    // Refresh documents to get the new analysis
                    fetchDocuments()
                    
                    // Remove from analyzing set
                    setAnalyzingDocuments(prev => {
                      const next = new Set(prev)
                      next.delete(documentId)
                      return next
                    })
                  }, 1000)
                  
                  return // Exit the streaming loop
                }

              } catch (e) {
                // Ignore invalid JSON lines
                console.warn('Failed to parse analysis update:', e)
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }

      // Refresh documents to show the new analysis
      await fetchDocuments()
    } catch (error) {
      console.error('Analysis failed:', error)
      
      // Check if it was cancelled by user
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analysis was cancelled by user')
        return // Don't show error message for user cancellation
      }
      
      // Clean up analyzing state and progress tracking
      setAnalyzingDocuments(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
      setAnalysisProgress(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setAnalysisStatus(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setAnalysisDetails(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setExpandedReasoning(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      
      alert('Analysis failed. Please try again.')
    } finally {
      // Clean up abort controller
      setAnalysisAbortControllers(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      
      setAnalyzingDocuments(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
      setAnalysisProgress(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setAnalysisStatus(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setAnalysisDetails(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
      setExpandedReasoning(prev => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
    }
  }

  // Helper function to extract title and content from reasoning text
  const parseReasoningText = (text: string) => {
    const titleMatch = text.match(/\*\*(.*?)\*\*/)
    if (titleMatch) {
      const title = titleMatch[1]
      const content = text.replace(/\*\*(.*?)\*\*\s*/, '').trim()
      return { title, content }
    }
    return { title: 'AI Reasoning', content: text }
  }

  // Toggle reasoning expansion
  const toggleReasoning = (documentId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }))
  }

  const getAnalysisStageIcon = (stage: string) => {
    switch (stage) {
      case 'initializing':
        return { icon: Zap, color: 'text-blue-500', description: 'Initializing analysis engine...' }
      case 'biomarker_analysis':
        return { icon: FlaskConical, color: 'text-purple-500', description: 'Analyzing biomarker patterns...' }
      case 'demographic_analysis':
        return { icon: Brain, color: 'text-indigo-500', description: 'Processing demographic context...' }
      case 'generating_insights':
        return { icon: Cpu, color: 'text-green-500', description: 'Generating health insights...' }
      case 'supplement_analysis':
        return { icon: Pill, color: 'text-orange-500', description: 'Analyzing supplement recommendations...' }
      case 'diet_analysis':
        return { icon: Apple, color: 'text-red-500', description: 'Generating dietary recommendations...' }
      case 'lifestyle_analysis':
        return { icon: Dumbbell, color: 'text-yellow-500', description: 'Creating lifestyle guidance...' }
      case 'saving':
        return { icon: Save, color: 'text-teal-500', description: 'Saving analysis results...' }
      case 'recommendations':
        return { icon: Database, color: 'text-cyan-500', description: 'Storing recommendations...' }
      case 'biomarker_update':
        return { icon: Activity, color: 'text-pink-500', description: 'Updating biomarker status...' }
      case 'complete':
        return { icon: CheckCircle, color: 'text-green-600', description: 'Analysis complete!' }
      default:
        return { icon: Clock, color: 'text-blue-500', description: 'Processing...' }
    }
  }

  const getDocumentStatus = (doc: DocumentWithAnalysis) => {
    if (analyzingDocuments.has(doc.id)) {
      return { icon: Clock, color: 'text-blue-600', text: 'Analyzing...', bgColor: 'bg-blue-50' }
    }
    if (doc.analysis) {
      return { icon: CheckCircle, color: 'text-green-600', text: 'Analyzed', bgColor: 'bg-green-50' }
    }
    if (doc.status === 'completed') {
      return { icon: Activity, color: 'text-primary-600', text: 'Ready to Analyze', bgColor: 'bg-primary-50' }
    }
    if (doc.status === 'processing') {
      return { icon: Clock, color: 'text-yellow-600', text: 'Processing...', bgColor: 'bg-yellow-50' }
    }
    return { icon: AlertCircle, color: 'text-red-600', text: 'Failed', bgColor: 'bg-red-50' }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  // Cancel analysis function
  const cancelAnalysis = (documentId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to stop the analysis? This will cancel the current progress and you\'ll need to restart the analysis.'
    )
    
    if (!confirmed) return

    // Abort the ongoing request
    const abortController = analysisAbortControllers[documentId]
    if (abortController) {
      abortController.abort()
    }

    // Clean up state
    setAnalyzingDocuments(prev => {
      const next = new Set(prev)
      next.delete(documentId)
      return next
    })
    setAnalysisProgress(prev => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
    setAnalysisStatus(prev => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
    setAnalysisDetails(prev => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
    setExpandedReasoning(prev => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })

    // Remove abort controller
    setAnalysisAbortControllers(prev => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse">
          <FileText className="h-8 w-8 text-primary-500" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-neutral-800">Your Documents</h1>
              <p className="text-neutral-600 mt-1">
                View your uploaded blood tests and their biomarker extractions
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-600">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </div>
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Test
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Documents List */}
        <div className="space-y-6">
          {documents.map((document, index) => {
            const status = getDocumentStatus(document)
            const StatusIcon = status.icon
            
            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Document Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-primary-50 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-neutral-800 mb-1">
                            {document.filename}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(document.uploaded_at)}
                            </span>
                            <span>{formatFileSize(document.filesize)}</span>
                            <div className={`flex items-center px-2 py-1 rounded-full ${status.bgColor}`}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />
                              <span className={`text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Biomarkers Summary */}
                      {document.biomarker_readings.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">
                            Extracted Biomarkers ({document.biomarker_readings.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {document.biomarker_readings.slice(0, 6).map((biomarker, idx) => (
                              <div key={idx} className="bg-neutral-50 px-3 py-2 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-neutral-800">
                                    {biomarker.biomarker_name}
                                  </span>
                                  {biomarker.status && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      biomarker.status === 'optimal' ? 'bg-green-100 text-green-700' :
                                      biomarker.status === 'suboptimal' ? 'bg-yellow-100 text-yellow-700' :
                                      biomarker.status === 'deficient' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {biomarker.status}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-600 mt-1">
                                  {biomarker.value} {biomarker.unit}
                                  {biomarker.reference_range && (
                                    <span className="ml-2">({biomarker.reference_range})</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {document.biomarker_readings.length > 6 && (
                              <div className="bg-neutral-50 px-3 py-2 rounded-lg flex items-center justify-center text-sm text-neutral-600">
                                +{document.biomarker_readings.length - 6} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Analysis Summary */}
                      {document.analysis && (
                        <div className="bg-gradient-to-r from-primary-50 to-sage-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-neutral-800 mb-1">
                                Health Analysis Available
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-neutral-600">
                                <span>Score: {document.analysis.overall_health_score}/100</span>
                                <span className="capitalize">{document.analysis.health_category}</span>
                                <span>{formatDate(document.analysis.created_at)}</span>
                              </div>
                            </div>
                            <Link href={`/analysis/${document.analysis.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View Analysis
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex flex-col space-y-2">
                      {!document.analysis && document.status === 'completed' && document.biomarker_readings.length > 0 && (
                        <div className="space-y-2">
                          {/* Launch Analysis Button or Progress Display */}
                          {!analyzingDocuments.has(document.id) ? (
                            <Button
                              onClick={() => startAnalysis(document.id)}
                              className="whitespace-nowrap w-full"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Launch Analysis
                            </Button>
                          ) : (
                            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 min-h-[12rem] flex flex-col justify-between">
                              {/* Main Progress Content */}
                              <div className="space-y-3 flex-1">
                                {/* Progress Header */}
                                <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {(() => {
                                    const stage = analysisDetails[document.id]?.stage || 'initializing'
                                    const stageInfo = getAnalysisStageIcon(stage)
                                    const StageIcon = stageInfo.icon
                                    return (
                                      <>
                                        <StageIcon className={`h-4 w-4 ${stageInfo.color} animate-pulse`} />
                                        <span className="text-sm font-medium text-neutral-700">
                                          Analysis in Progress
                                        </span>
                                      </>
                                    )
                                  })()}
                                </div>
                                <span className="text-xs text-neutral-500">
                                  {analysisProgress[document.id] || 0}%
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${analysisProgress[document.id] || 0}%` }}
                                />
                              </div>

                              {/* Current Status */}
                              <div className="space-y-1 min-h-[2.5rem]">
                                <div className="text-xs text-neutral-600 font-medium">
                                  {(() => {
                                    const stage = analysisDetails[document.id]?.stage || 'initializing'
                                    const stageInfo = getAnalysisStageIcon(stage)
                                    return stageInfo.description
                                  })()}
                                </div>
                                
                                {/* AI Reasoning Section - Collapsible */}
                                {analysisStatus[document.id] && (analysisStatus[document.id].includes('🧠') || analysisStatus[document.id].includes('**')) ? (
                                  <div className="text-xs">
                                    {(() => {
                                      const reasoningText = analysisStatus[document.id]
                                      // Clean up the text by removing prefixes
                                      const cleanText = reasoningText.replace(/^🧠\s*(AI:\s*)?/, '').trim()
                                      const { title, content } = parseReasoningText(cleanText)
                                      const isExpanded = expandedReasoning[document.id]
                                      
                                      return (
                                        <div className="border border-neutral-200 rounded bg-neutral-50/50">
                                          <button
                                            onClick={() => toggleReasoning(document.id)}
                                            className="flex items-center justify-between w-full text-left p-2 hover:bg-neutral-100 rounded transition-colors"
                                          >
                                            <div className="flex items-center space-x-1">
                                              <span>🧠</span>
                                              <span className="text-neutral-600 font-medium">{title}</span>
                                            </div>
                                            <ChevronDown 
                                              className={`w-3 h-3 text-neutral-400 transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                              }`}
                                            />
                                          </button>
                                          {isExpanded && (
                                            <div className="px-2 pb-2 text-neutral-500 text-xs border-t border-neutral-200 pt-2 max-h-32 overflow-y-auto">
                                              {content}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                ) : (
                                  <div className="text-xs text-neutral-500">
                                    {analysisStatus[document.id] || 'Starting analysis...'}
                                  </div>
                                )}
                              </div>

                              {/* Analysis Details */}
                              {analysisDetails[document.id] && Object.keys(analysisDetails[document.id]).length > 1 && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {analysisDetails[document.id].biomarkersCount && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                      {analysisDetails[document.id].biomarkersCount} biomarkers
                                    </span>
                                  )}
                                  {analysisDetails[document.id].insights && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                      {analysisDetails[document.id].insights} insights
                                    </span>
                                  )}
                                  {analysisDetails[document.id].supplements && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                                      {analysisDetails[document.id].supplements} supplements
                                    </span>
                                  )}
                                  {analysisDetails[document.id].healthScore && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                      Score: {analysisDetails[document.id].healthScore}/100
                                    </span>
                                  )}
                                </div>
                              )}
                              </div>

                              {/* Cancel Button */}
                              <Button
                                onClick={() => cancelAnalysis(document.id)}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancel Analysis
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {document.analysis && (
                        <Link href={`/analysis/${document.analysis.id}`}>
                          <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}

          {/* Empty State */}
          {documents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-16"
            >
              <div className="bg-primary-50 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">
                No Documents Yet
              </h3>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                Upload your first blood test to start your health optimization journey
              </p>
              <Link href="/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Blood Test
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
} 