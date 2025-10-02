'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
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
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [expandedReasoning, setExpandedReasoning] = useState<{[key: string]: boolean}>({})

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

  const processDocumentWithStreaming = async (documentId: string, fileId: string, token: string | undefined) => {
    if (!token) throw new Error('No authentication token available')

    const response = await fetch(`/api/documents/${documentId}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/stream'
      }
    })

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`)
    }

    const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader()
    if (!reader) throw new Error('Failed to create stream reader')

    let progressPercentage = 0

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        // Parse each line as a JSON update
        const lines = value.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const update = JSON.parse(line)
            
            // Only log meaningful AI reasoning summaries
            if (update.details?.hasSummaryText) {
              console.log('🧠 [AI REASONING]:', update.status)
            }
            
            // Calculate progress based on AI reasoning phases
            if (update.details?.phase) {
              switch (update.details.phase) {
                case 'initialization':
                case 'validation':
                case 'download':
                case 'ocr':
                  progressPercentage = 15
                  break
                case 'reasoning':
                  // Progressive reasoning steps
                  const reasoningSteps = ['document_analysis', 'pattern_recognition', 'knowledge_matching', 'standardization']
                  const stepIndex = reasoningSteps.indexOf(update.details.step || '')
                  progressPercentage = 20 + (stepIndex >= 0 ? (stepIndex / reasoningSteps.length) * 40 : 0)
                  break
                case 'generating':
                  progressPercentage = Math.min(65 + (update.details.generatedTokens || 0) / 20, 85)
                  break
                case 'validation':
                  progressPercentage = 88
                  break
                case 'enhancement':
                  progressPercentage = 92
                  break
                case 'completed':
                case 'complete':
                  progressPercentage = 100
                  break
                default:
                  progressPercentage = Math.min(progressPercentage + 2, 95)
              }
            }

            // Update the file status with AI reasoning metrics
            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    progress: progressPercentage,
                    processingStatus: update.status,
                    processingDetails: update.details,
                    status: (update.details?.phase === 'complete' || update.details?.phase === 'completed') ? 'success' as const : 'processing' as const,
                    aiMetrics: update.details?.phase ? {
                      phase: update.details.phase,
                      reasoningTokens: update.details.reasoningTokens || 0,
                      generatedTokens: update.details.generatedTokens || 0,
                      thoughtProcess: update.details.thoughtProcess,
                      biomarkersFound: update.details.biomarkersFound,
                      databaseMatches: update.details.databaseMatches,
                      confidence: update.details.confidence
                    } : (update.details?.hasSummaryText && f.aiMetrics ? {
                      ...f.aiMetrics,
                      thoughtProcess: update.details.thoughtProcess || f.aiMetrics.thoughtProcess, // Keep previous if no new one
                      reasoningTokens: update.details.reasoningTokens || f.aiMetrics.reasoningTokens
                    } : f.aiMetrics)
                  }
                : f
            ))

            // If processing is complete, break
            if (update.details?.phase === 'complete' || update.details?.phase === 'completed') {
              break
            }

          } catch (parseError) {
            console.warn('Failed to parse streaming update:', parseError)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
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

        // Trigger streaming processing
        try {
          await processDocumentWithStreaming(uploadResult.document.id, fileObj.id, session?.access_token)
        } catch (processingError) {
          console.error('Processing failed:', processingError)
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'error' as const, processingStatus: 'Processing failed' }
              : f
          ))
        }
      }

      // Navigate to documents page after all files are processed
      setTimeout(() => {
        router.push('/documents')
      }, 2000)
      
    } catch (error) {
      console.error('Upload failed:', error)
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-light text-neutral-800 mb-4">
            Upload Your Blood Test Results
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Share your blood test documents with us. Our AI will carefully analyze 
            your biomarkers and provide personalized wellness insights.
          </p>
        </motion.div>

        {/* Upload Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              Supported Formats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-50 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-neutral-800">PDF Documents</div>
                  <div className="text-sm text-neutral-600">Lab reports, test results</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-stone-50 p-2 rounded-lg">
                  <Camera className="h-5 w-5 text-stone-600" />
                </div>
                <div>
                  <div className="font-medium text-neutral-800">Photos</div>
                  <div className="text-sm text-neutral-600">Clear, readable images</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-sage-50 p-2 rounded-lg">
                  <Monitor className="h-5 w-5 text-sage-600" />
                </div>
                <div>
                  <div className="font-medium text-neutral-800">Screenshots</div>
                  <div className="text-sm text-neutral-600">Digital lab portals</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-300 hover:bg-neutral-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-primary-100 p-6 rounded-full">
                    <Upload className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-neutral-800 mb-2">
                    {isDragActive ? 'Drop your files here' : 'Upload your blood test results'}
                  </h3>
                  <p className="text-neutral-600">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-sm text-neutral-500 mt-2">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="p-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-6">
                Uploaded Files ({files.length})
              </h3>
              <div className="space-y-4">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
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
                                          >
                                            <div className="text-neutral-600">💭 {title}</div>
                                            <ChevronDown 
                                              className={`w-3 h-3 text-neutral-400 transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                              }`}
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
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center"
          >
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
            <p className="text-sm text-neutral-500 mt-4">
              Your data is encrypted and processed securely
            </p>
          </motion.div>
        )}

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
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