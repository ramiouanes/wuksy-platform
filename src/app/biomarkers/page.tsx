'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter,
  Heart,
  Activity,
  Zap,
  Shield,
  Brain,
  Bone,
  Eye,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  ExternalLink,
  Calendar,
  Users,
  Award,
  Loader2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { EnrichedBiomarker, BiomarkersResponse } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useBreakpoint, isMobileBreakpoint } from '@/hooks/useBreakpoint'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'Blood Health': Heart,
  'Vitamins': Bone,
  'Lipid Panel': Activity,
  'Metabolic Panel': Zap,
  'Thyroid Panel': Brain,
  'Kidney Function': Eye,
  'Cardiovascular': Heart,
  'Hormones': Brain,
  'Minerals': Shield,
  'Inflammation': AlertTriangle,
  'Other': Info
}

// Color mapping for categories
const categoryColors: Record<string, string> = {
  'Blood Health': 'red',
  'Vitamins': 'yellow',
  'Lipid Panel': 'blue',
  'Metabolic Panel': 'orange',
  'Thyroid Panel': 'purple',
  'Kidney Function': 'teal',
  'Cardiovascular': 'red',
  'Hormones': 'indigo',
  'Minerals': 'green',
  'Inflammation': 'pink',
  'Other': 'gray'
}

export default function BiomarkersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [ratioFilter, setRatioFilter] = useState('all') // 'all', 'ratio', 'non-ratio'
  const [biomarkersData, setBiomarkersData] = useState<BiomarkersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedBiomarkers, setExpandedBiomarkers] = useState<Set<string>>(new Set())
  
  const { user, session } = useAuth()
  const router = useRouter()
  const breakpoint = useBreakpoint()
  const prefersReducedMotion = useReducedMotion()
  const isMobile = isMobileBreakpoint(breakpoint)

  // Fetch biomarkers data
  useEffect(() => {
    const fetchBiomarkers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/biomarkers')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch biomarkers: ${response.statusText}`)
        }
        
        const data: BiomarkersResponse = await response.json()
        setBiomarkersData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load biomarkers')
      } finally {
        setLoading(false)
      }
    }

    fetchBiomarkers()
  }, [])

  const filteredBiomarkers = biomarkersData?.biomarkers.filter(biomarker => {
    const searchText = searchTerm.toLowerCase()
    const matchesSearch = 
      biomarker.name.toLowerCase().includes(searchText) ||
      biomarker.description?.toLowerCase().includes(searchText) ||
      biomarker.improved_description?.toLowerCase().includes(searchText) ||
      biomarker.clinical_significance?.toLowerCase().includes(searchText) ||
      biomarker.aliases?.some(alias => alias.toLowerCase().includes(searchText))
    
    const matchesCategory = selectedCategory === 'All' || biomarker.category === selectedCategory
    
    // Check if biomarker is a ratio (contains "/" or "ratio" in name/formula)
    const isRatio = biomarker.name.includes('/') || 
                   biomarker.name.toLowerCase().includes('ratio') ||
                   biomarker.formula?.includes('/') ||
                   biomarker.description?.toLowerCase().includes('ratio')
    
    const matchesRatioFilter = ratioFilter === 'all' || 
                              (ratioFilter === 'ratio' && isRatio) ||
                              (ratioFilter === 'non-ratio' && !isRatio)
    
    return matchesSearch && matchesCategory && matchesRatioFilter
  }) || []

  const toggleBiomarkerExpansion = (biomarkerId: string) => {
    const newExpanded = new Set(expandedBiomarkers)
    if (newExpanded.has(biomarkerId)) {
      newExpanded.delete(biomarkerId)
    } else {
      newExpanded.add(biomarkerId)
    }
    setExpandedBiomarkers(newExpanded)
  }

  const formatOptimalRange = (biomarker: EnrichedBiomarker) => {
    const hasOptimal = biomarker.optimal_ranges.length > 0
    const hasConventional = biomarker.conventional_min !== null && biomarker.conventional_max !== null
    
    if (hasOptimal) {
      const primaryRange = biomarker.optimal_ranges.find(r => r.is_primary) || biomarker.optimal_ranges[0]
      return {
        optimal: `${primaryRange.optimal_min}-${primaryRange.optimal_max} ${biomarker.unit}`,
        conventional: hasConventional ? `${biomarker.conventional_min}-${biomarker.conventional_max} ${biomarker.unit}` : null,
        gender: primaryRange.gender && primaryRange.gender !== 'all' ? primaryRange.gender : null
      }
    }
    
    if (hasConventional) {
      return {
        optimal: null,
        conventional: `${biomarker.conventional_min}-${biomarker.conventional_max} ${biomarker.unit}`,
        gender: null
      }
    }
    
    return {
      optimal: null,
      conventional: null,
      gender: null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'attention':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'concerning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-neutral-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category] || Info
    return IconComponent
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || 'gray'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading biomarkers...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="py-8 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
            className="space-y-3"
          >
            <h1 className="text-2xl md:text-3xl font-light text-neutral-800">
              <span className="zen-text font-medium">Biomarkers</span>
            </h1>
            <p className="text-base text-neutral-600 max-w-xl mx-auto">
              Explore key health markers and their optimal ranges
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar Layout */}
      <section className="py-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Main Content Area with Filters - shows first on mobile, left on desktop */}
            <div className="order-1 lg:order-1 flex-1 min-w-0">
              
              {/* Search and Filter - Integrated */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
                className="mb-6 bg-white p-4 rounded-lg border border-neutral-200"
              >
                <div className="space-y-4">
                  {/* Tab Filters */}
                  <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg w-full sm:w-fit">
                    <button
                      onClick={() => setRatioFilter('all')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        ratioFilter === 'all' 
                          ? 'bg-white text-neutral-900 shadow-sm' 
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setRatioFilter('ratio')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        ratioFilter === 'ratio' 
                          ? 'bg-white text-neutral-900 shadow-sm' 
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Ratios
                    </button>
                    <button
                      onClick={() => setRatioFilter('non-ratio')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        ratioFilter === 'non-ratio' 
                          ? 'bg-white text-neutral-900 shadow-sm' 
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Individual
                    </button>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          placeholder="Search biomarkers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 h-9 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                      >
                        {biomarkersData?.categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Results Counter */}
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-sm text-neutral-600">
                      {filteredBiomarkers.length} biomarkers
                      {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBiomarkers.map((biomarker, index) => {
              const IconComponent = getCategoryIcon(biomarker.category)
              const color = getCategoryColor(biomarker.category)
              const isExpanded = expandedBiomarkers.has(biomarker.id)
              
              const rangeInfo = formatOptimalRange(biomarker)
              
              return (
              <motion.div
                key={biomarker.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 + index * 0.05 }}
              >
                  <Card className={`${isExpanded ? 'p-5' : 'p-4'} hover:shadow-md transition-all duration-200 border border-neutral-200 cursor-pointer`}
                        onClick={() => toggleBiomarkerExpansion(biomarker.id)}>
                  
                  {/* Header with title and category */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-base font-medium text-neutral-800 truncate">
                          {biomarker.name}
                        </h3>
                        <div className={`px-2 py-0.5 rounded text-xs font-medium bg-${color}-50 text-${color}-700 flex-shrink-0`}>
                          {biomarker.category}
                        </div>
                      </div>
                      {biomarker.aliases && biomarker.aliases.length > 0 && !isExpanded && (
                        <p className="text-xs text-neutral-500 truncate">
                          {biomarker.aliases[0]}{biomarker.aliases.length > 1 ? ` +${biomarker.aliases.length - 1} more` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Ranges Display */}
                  <div className="space-y-2 mb-3">
                    {rangeInfo.optimal && (
                      <div className="bg-green-50 px-3 py-2 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-800">Optimal</span>
                          {rangeInfo.gender && (
                            <span className="text-xs text-green-600">({rangeInfo.gender})</span>
                          )}
                        </div>
                        <div className="text-sm text-green-700 font-medium">
                          {rangeInfo.optimal}
                        </div>
                      </div>
                    )}
                    
                    {rangeInfo.conventional && (
                      <div className="bg-neutral-50 px-3 py-2 rounded">
                        <div className="text-xs font-medium text-neutral-700 mb-1">Conventional</div>
                        <div className="text-sm text-neutral-600">
                          {rangeInfo.conventional}
                        </div>
                      </div>
                    )}
                    
                    {!rangeInfo.optimal && !rangeInfo.conventional && (
                      <div className="bg-neutral-50 px-3 py-2 rounded">
                        <div className="text-sm text-neutral-600">
                          Range varies by demographics
                        </div>
                      </div>
                    )}
                  </div>
                  


                  {/* Bottom indicators and expand hint */}
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center space-x-3">
                      {biomarker.optimal_ranges.length > 1 && (
                        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">
                          +{biomarker.optimal_ranges.length - 1} ranges
                        </span>
                      )}
                      {biomarker.scientific_references.length > 0 && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                          {biomarker.scientific_references.length} refs
                        </span>
                      )}
                    </div>
                    
                    <span className="text-primary-600 hover:text-primary-700">
                      {isExpanded ? 'Click to collapse' : 'Click for details'}
                    </span>
                  </div>

                  {/* Expanded Content - Streamlined */}
                  {isExpanded && (
                    <motion.div
                      initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, height: 'auto' }}
                      exit={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                      className="space-y-4 pt-4 mt-4 border-t border-neutral-100"
                    >
                      {/* Full Description */}
                      {(biomarker.improved_description || biomarker.description) && (
                        <div>
                          <ExpandableText
                            text={biomarker.improved_description || biomarker.description || ''}
                            maxLines={isMobile ? 3 : 5}
                            className="text-sm text-neutral-600 leading-relaxed"
                          />
                        </div>
                      )}

                      {/* All Aliases */}
                      {biomarker.aliases && biomarker.aliases.length > 1 && (
                        <div>
                          <div className="text-xs font-medium text-neutral-700 mb-1">
                            Also Known As
                          </div>
                          <p className="text-xs text-neutral-600">
                            {biomarker.aliases.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Clinical Significance */}
                      {biomarker.clinical_significance && (
                        <div>
                          <div className="text-xs font-medium text-neutral-700 mb-1">
                            Clinical Significance
                          </div>
                          <ExpandableText
                            text={biomarker.clinical_significance}
                            maxLines={isMobile ? 2 : 4}
                            className="text-xs text-neutral-600 leading-relaxed"
                          />
                        </div>
                      )}

                      {/* Additional Ranges */}
                      {biomarker.optimal_ranges.length > 1 && (
                        <div>
                          <div className="text-xs font-medium text-neutral-700 mb-1">
                            Additional Optimal Ranges
                          </div>
                          <div className="space-y-1">
                            {biomarker.optimal_ranges.slice(1, 3).map((range, idx) => (
                              <div key={range.id} className="bg-green-50 px-3 py-2 rounded">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-green-700">
                                    {range.optimal_min}-{range.optimal_max} {biomarker.unit}
                                  </span>
                                  {(range.gender && range.gender !== 'all') && (
                                    <span className="text-xs text-green-600">({range.gender})</span>
                                  )}
                                </div>
                                {(range.age_min || range.age_max) && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Age: {range.age_min || '0'}-{range.age_max || '∞'}
                                  </div>
                                )}
                              </div>
                            ))}
                            {biomarker.optimal_ranges.length > 3 && (
                              <div className="text-xs text-neutral-500 text-center py-1">
                                +{biomarker.optimal_ranges.length - 3} more ranges
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Key References - Simplified */}
                      {biomarker.scientific_references.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-neutral-700 mb-1">
                            Key Studies ({biomarker.scientific_references.length})
                          </div>
                          <div className="space-y-1">
                            {biomarker.scientific_references.slice(0, 2).map((ref, idx) => (
                              <div key={ref.id} className="text-xs bg-blue-50 p-2 rounded">
                                <div className="font-medium text-blue-900 mb-1 line-clamp-1">
                                  {ref.title}
                                </div>
                                <div className="text-blue-700 text-[10px]">
                                  {ref.journal} ({ref.publication_year})
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
              )
            })}
          </div>

          {filteredBiomarkers.length === 0 && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
              className="text-center py-16"
            >
              <div className="bg-neutral-100 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                No biomarkers found
              </h3>
              <p className="text-neutral-600 mb-6">
                Try adjusting your search terms or category filter.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
              
            </div> {/* End Main Content Area */}
            
            {/* Right Sidebar with Range Guide and CTA - shows second on mobile (bottom), right on desktop */}
            <div className="order-2 lg:order-2 lg:w-80 flex-shrink-0 space-y-6">
              
              {/* Range Guide */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
                className="zen-gradient p-5 rounded-lg lg:sticky lg:top-4"
              >
                <div className="text-center mb-4">
                  <h2 className="text-lg font-light text-neutral-800 mb-2">
                    <span className="zen-text font-medium">Range Guide</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2.5 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Optimal</h3>
                      <p className="text-xs text-green-600">Target range for best health</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2.5 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Monitor</h3>
                      <p className="text-xs text-yellow-600">May need lifestyle changes</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2.5 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Consult</h3>
                      <p className="text-xs text-red-600">Seek medical advice</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
                className="zen-gradient p-5 rounded-lg text-center lg:sticky lg:top-72"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-light text-neutral-800">
                    Analyze Your Results
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Get personalized insights from your blood tests
                  </p>
                  <Button size="sm" className="px-4 py-2 w-full" onClick={() => router.push('/upload')}>
                    Upload Test Results
                    <TrendingUp className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </motion.div>

            </div> {/* End Right Sidebar */}
            
          </div> {/* End Sidebar Layout */}
        </div>
      </section>
    </div>
  )
} 