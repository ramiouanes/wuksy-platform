'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Camera,
  Smartphone,
  Monitor,
  Cpu,
  Clock,
  Zap,
  ChevronDown
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface UploadedFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  id: string
  processingStatus?: string
  processingDetails?: any
  // AI Reasoning metrics
  aiMetrics?: {
    phase: 'initialization' | 'reasoning' | 'generating' | 'validation' | 'enhancement' | 'complete'
    reasoningTokens: number
    generatedTokens: number
    thoughtProcess?: string
    biomarkersFound?: number
    databaseMatches?: number
    confidence?: number
  }
}

export default function UploadPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const breakpoint = useBreakpoint()
  const prefersReducedMotion = useReducedMotion()
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm'
  
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [expandedReasoning, setExpandedReasoning] = useState<{[key: string]: boolean}>({})

  // Collapse AI reasoning by default on mobile, expand on desktop
  useEffect(() => {
    files.forEach(fileObj => {
      if (!isMobile && fileObj.aiMetrics?.thoughtProcess) {
        setExpandedReasoning(prev => ({ ...prev, [fileObj.id]: true }))
      }
    })
  }, [files, isMobile])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup any ongoing polls when component unmounts
      // (polling intervals are already cleaned up in the promise)
    }
  }, [])

  // Helper function to extract title and content from reasoning text
  const parseReasoningText = (text: string) => {
    const titleMatch = text.match(/\*\*(.*?)\*\*/)
    if (titleMatch) {
      const title = titleMatch[1]
      const content = text.replace(/\*\*(.*?)\*\*\s*/, '').trim()
      return { title, content }
    }
    return { title: 'Reasoning', content: text }
  }

  // Toggle reasoning expansion
  const toggleReasoning = (fileId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }))
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9)
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const processDocumentWithPolling = async (documentId: string, fileId: string, token: string | undefined) => {
    if (!token) throw new Error('No authentication token available')
    
    // Step 1: Trigger the processing job
    try {
      const triggerResponse = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!triggerResponse.ok) {
        throw new Error(`Failed to trigger processing: ${triggerResponse.statusText}`)
      }

      await triggerResponse.json()
    } catch (error) {
      throw error
    }

    // Step 2: Poll for status updates
    const startTime = Date.now()
    const maxDuration = 3 * 60 * 1000 // 3 minutes
    let pollCount = 0

    return new Promise<void>((resolve, reject) => {
      const poll = async () => {
        try {
          pollCount++
          const elapsed = Date.now() - startTime

          // Timeout
          if (elapsed > maxDuration) {
            clearInterval(intervalId)
            reject(new Error('Processing timeout (3 minutes)'))
            return
          }

          // Fetch status
          const response = await fetch(`/api/documents/${documentId}/processing-status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`Status check failed: ${response.statusText}`)
          }

          const data = await response.json()

          // Calculate progress
          let progressPercentage = data.progress || 0

          // Update file state (use direct fields from response)
          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  progress: progressPercentage,
                  processingStatus: data.currentMessage || 'Processing...',
                  processingDetails: {
                    phase: data.currentPhase,
                    thoughtProcess: data.thoughtProcess, // Direct from response
                    biomarkersFound: data.biomarkersFound,
                    confidence: data.confidence
                  },
                  status: data.status === 'completed' ? 'success' as const : 'processing' as const,
                  aiMetrics: data.currentPhase ? {
                    phase: data.currentPhase,
                    reasoningTokens: 0,
                    generatedTokens: 0,
                    thoughtProcess: data.thoughtProcess, // Direct from response
                    biomarkersFound: data.biomarkersFound,
                    confidence: data.confidence
                  } : f.aiMetrics
                }
              : f
          ))

          // Check completion
          if (data.status === 'completed') {
            clearInterval(intervalId)
            resolve()
          } else if (data.status === 'failed') {
            clearInterval(intervalId)
            reject(new Error('Processing failed'))
          }

        } catch (error) {
          if (pollCount > 5) {
            clearInterval(intervalId)
            reject(error)
          }
        }
      }

      // Initial poll
      poll()

      // Poll every 2 seconds
      const intervalId = setInterval(poll, 2000)
    })
  }

  const uploadFiles = async () => {
    if (!user || files.length === 0) return

    setIsUploading(true)
    
    try {
      for (const fileObj of files) {
        if (fileObj.status !== 'pending') continue
        
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'uploading' as const }
            : f
        ))

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, progress }
              : f
          ))
        }

        // Upload to API
        const formData = new FormData()
        formData.append('file', fileObj.file)
        
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }

        const uploadResult = await uploadResponse.json()
        
        // Set upload success status and start processing
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processing' as const, progress: 0, processingStatus: 'Starting processing...' }
            : f
        ))

        // Trigger polling-based processing
        try {
          await processDocumentWithPolling(uploadResult.document.id, fileObj.id, session?.access_token)
        } catch (processingError) {
          // Extract error message from the error object
          const errorMessage = processingError instanceof Error 
            ? processingError.message 
            : 'Processing failed'
          
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'error' as const, processingStatus: errorMessage }
              : f
          ))
        }
      }
      
    } catch (error) {
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-neutral-400" />
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'initialization':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'reasoning':
        return <Cpu className="h-4 w-4 text-purple-500 animate-pulse" />
      case 'generating':
        return <Clock className="h-4 w-4 text-green-500" />
      case 'validation':
      case 'enhancement':
        return <Cpu className="h-4 w-4 text-orange-500" />
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Cpu className="h-4 w-4 text-blue-500" />
    }
  }

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'initialization':
        return 'Initializing AI system...'
      case 'reasoning':
        return 'AI analyzing document structure and patterns...'
      case 'generating':
        return 'Generating biomarker extraction...'
      case 'validation':
        return 'Validating extracted data...'
      case 'enhancement':
        return 'Enhancing with database matching...'
      case 'complete':
        return 'Analysis complete!'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl sm:text-3xl font-light text-neutral-800 mb-4">
            Upload Your Blood Test Results
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            Share your blood test documents with us. Our AI will carefully analyze 
            your biomarkers and provide personalized wellness insights.
          </p>
        </motion.div>

        {/* Upload Instructions */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              Supported Formats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-50 p-2 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-neutral-800 text-sm sm:text-base">PDF Documents</div>
                  <div className="text-xs sm:text-sm text-neutral-600 truncate">Lab reports, test results</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-stone-50 p-2 rounded-lg flex-shrink-0">
                  <Camera className="h-5 w-5 text-stone-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-neutral-800 text-sm sm:text-base">Photos</div>
                  <div className="text-xs sm:text-sm text-neutral-600 truncate">Clear, readable images</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-sage-50 p-2 rounded-lg flex-shrink-0">
                  <Monitor className="h-5 w-5 text-sage-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-neutral-800 text-sm sm:text-base">Screenshots</div>
                  <div className="text-xs sm:text-sm text-neutral-600 truncate">Digital lab portals</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-4 sm:p-6 md:p-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 md:p-12 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-300 hover:bg-neutral-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-primary-100 p-4 sm:p-6 rounded-full">
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-neutral-800 mb-2">
                    {isDragActive ? 'Drop your files here' : 'Upload your blood test results'}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                    Supports PDF, JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* File List */}
        {files.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="p-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-6">
                Uploaded Files ({files.length})
              </h3>
              <div className="space-y-4" aria-live="polite" aria-atomic="false">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    aria-busy={fileObj.status === 'uploading' || fileObj.status === 'processing'}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      {getStatusIcon(fileObj.status)}
                      <div className="flex-1">
                        <div className="font-medium text-neutral-800">
                          {fileObj.file.name}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        {(fileObj.status === 'uploading' || fileObj.status === 'processing') && (
                          <div className="mt-2 w-full">
                            <div className="bg-neutral-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  fileObj.status === 'uploading' ? 'bg-primary-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${fileObj.progress}%` }}
                              />
                            </div>
                            {fileObj.status === 'processing' && fileObj.processingStatus && (
                              <div className="text-xs text-neutral-500 mt-1">
                                {/* Check if this is an AI reasoning update */}
                                {fileObj.aiMetrics?.thoughtProcess ? (
                                  <div>
                                    {(() => {
                                      const thoughtProcess = fileObj.aiMetrics?.thoughtProcess
                                      if (!thoughtProcess) return null
                                      
                                      const { title, content } = parseReasoningText(thoughtProcess)
                                      const isExpanded = expandedReasoning[fileObj.id]
                                      
                                      return (
                                        <div>
                                          <button
                                            onClick={() => toggleReasoning(fileObj.id)}
                                            className="flex items-center justify-between w-full text-left hover:bg-neutral-100 rounded p-1 transition-colors"
                                            aria-expanded={isExpanded}
                                            aria-label={isExpanded ? `Collapse AI reasoning: ${title}` : `Expand AI reasoning: ${title}`}
                                          >
                                            <div className="text-neutral-600">💭 {title}</div>
                                            <ChevronDown 
                                              className={`w-3 h-3 text-neutral-400 transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                              }`}
                                              aria-hidden="true"
                                            />
                                          </button>
                                          {isExpanded && (
                                            <div className="text-neutral-500 mt-2 pt-2 border-t border-neutral-200 text-xs">
                                              {content}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                ) : (
                                  <div>{fileObj.processingStatus}</div>
                                )}
                              </div>
                            )}
                            
                            {/* Results Preview */}
                            {fileObj.aiMetrics?.biomarkersFound !== undefined && (
                              <div className="mt-2 text-xs text-neutral-600">
                                🎯 Found {fileObj.aiMetrics?.biomarkersFound} biomarkers
                                {fileObj.aiMetrics?.databaseMatches !== undefined && 
                                  ` (${fileObj.aiMetrics?.databaseMatches} database matches)`
                                }
                                {fileObj.aiMetrics?.confidence !== undefined && 
                                  ` • ${Math.round((fileObj.aiMetrics?.confidence || 0) * 100)}% confidence`
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      disabled={fileObj.status === 'uploading' || fileObj.status === 'processing'}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label={`Remove file ${fileObj.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upload Button or View Results */}
        {files.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
            className="text-center"
          >
            {files.every(f => f.status === 'success' || f.status === 'error') && !isUploading ? (
              <Button
                size="lg"
                onClick={() => router.push('/documents')}
                className="px-8 py-3"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View Results
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={uploadFiles}
                disabled={isUploading || files.every(f => f.status !== 'pending')}
                className="px-8 py-3"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Analysis
                  </>
                )}
              </Button>
            )}
            <p className="text-sm text-neutral-500 mt-4">
              Your data is encrypted and processed securely
            </p>
          </motion.div>
        )}

        {/* Privacy Notice */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="p-6 bg-primary-50/50">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-500/10 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-800 mb-2">
                  Your Privacy is Protected
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  We use bank-level encryption to secure your health data. 
                  Your information is processed confidentially and never shared 
                  without your explicit consent. You can delete your data at any time.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}