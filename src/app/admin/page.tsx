'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Mail, 
  FileText, 
  Activity, 
  Database,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  LogOut,
  Home,
  BarChart3
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

interface Stats {
  totalUsers: number
  totalSubscribers: number
  totalDocuments: number
  totalBiomarkers: number
  totalAnalyses: number
  totalBiomarkerReadings: number
}

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  status: string
  ip_address?: string
  user_agent?: string
}

interface User {
  id: string
  email: string
  name: string
  created_at: string
  last_login_at?: string
  data_consent: boolean
  research_consent: boolean
}

interface Document {
  id: string
  filename: string
  filesize: number
  status: string
  uploaded_at: string
  users?: {
    email: string
    name: string
  }
}

interface Analysis {
  id: string
  overall_health_score: number
  health_category: string
  created_at: string
  users?: {
    email: string
    name: string
  }
  documents?: {
    filename: string
  }
}

interface Biomarker {
  id: string
  name: string
  category: string
  unit: string
  is_active: boolean
  created_at: string
}

type TabType = 'overview' | 'subscribers' | 'users' | 'documents' | 'analyses' | 'biomarkers'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [biomarkerCategories, setBiomarkerCategories] = useState<string[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab !== 'overview') {
      fetchTabData()
    }
  }, [activeTab, currentPage, searchTerm, statusFilter, categoryFilter])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTabData = async () => {
    try {
      setRefreshing(true)
      let url = ''
      
      switch (activeTab) {
        case 'subscribers':
          url = `/api/admin/subscribers?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`
          break
        case 'users':
          url = `/api/admin/users?page=${currentPage}&search=${searchTerm}`
          break
        case 'documents':
          url = `/api/admin/documents?page=${currentPage}&status=${statusFilter}`
          break
        case 'analyses':
          url = `/api/admin/analyses?page=${currentPage}`
          break
        case 'biomarkers':
          url = `/api/admin/biomarkers?page=${currentPage}&search=${searchTerm}&category=${categoryFilter}`
          break
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        
        switch (activeTab) {
          case 'subscribers':
            setSubscribers(data.subscribers)
            break
          case 'users':
            setUsers(data.users)
            break
          case 'documents':
            setDocuments(data.documents)
            break
          case 'analyses':
            setAnalyses(data.analyses)
            break
          case 'biomarkers':
            setBiomarkers(data.biomarkers)
            setBiomarkerCategories(data.categories || [])
            break
        }

        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalItems(data.pagination.total)
        }
      }
    } catch (error) {
      console.error('Error fetching tab data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/coming-soon')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/admin/${type}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriberId: id,
          userId: id,
          documentId: id,
          analysisId: id
        })
      })

      if (response.ok) {
        fetchTabData()
        fetchStats()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'subscribers', label: 'Subscribers', icon: Mail },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analyses', label: 'Analyses', icon: Activity },
    { id: 'biomarkers', label: 'Biomarkers', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Home className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-light text-neutral-800">
                WUKSY Admin Console
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/app')}
              >
                Go to App
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType)
                    setCurrentPage(1)
                    setSearchTerm('')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                  }}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && stats && (
                <OverviewTab stats={stats} onRefresh={fetchStats} />
              )}

              {activeTab === 'subscribers' && (
                <SubscribersTab
                  subscribers={subscribers}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onRefresh={fetchTabData}
                  onExport={() => handleExport('subscribers')}
                  onDelete={(id) => handleDelete('subscribers', id)}
                  formatDate={formatDate}
                  refreshing={refreshing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  setCurrentPage={setCurrentPage}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab
                  users={users}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onRefresh={fetchTabData}
                  onExport={() => handleExport('users')}
                  onDelete={(id) => handleDelete('users', id)}
                  formatDate={formatDate}
                  refreshing={refreshing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  setCurrentPage={setCurrentPage}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onRefresh={fetchTabData}
                  onDelete={(id) => handleDelete('documents', id)}
                  formatDate={formatDate}
                  formatFileSize={formatFileSize}
                  refreshing={refreshing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  setCurrentPage={setCurrentPage}
                />
              )}

              {activeTab === 'analyses' && (
                <AnalysesTab
                  analyses={analyses}
                  onRefresh={fetchTabData}
                  onDelete={(id) => handleDelete('analyses', id)}
                  formatDate={formatDate}
                  refreshing={refreshing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  setCurrentPage={setCurrentPage}
                />
              )}

              {activeTab === 'biomarkers' && (
                <BiomarkersTab
                  biomarkers={biomarkers}
                  categories={biomarkerCategories}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onRefresh={fetchTabData}
                  refreshing={refreshing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  setCurrentPage={setCurrentPage}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Email Subscribers', value: stats.totalSubscribers, icon: Mail, color: 'bg-green-500' },
    { label: 'Documents', value: stats.totalDocuments, icon: FileText, color: 'bg-purple-500' },
    { label: 'Health Analyses', value: stats.totalAnalyses, icon: Activity, color: 'bg-orange-500' },
    { label: 'Biomarkers', value: stats.totalBiomarkers, icon: Database, color: 'bg-pink-500' },
    { label: 'Biomarker Readings', value: stats.totalBiomarkerReadings, icon: TrendingUp, color: 'bg-indigo-500' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">Dashboard Overview</h2>
        <Button onClick={onRefresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-light text-neutral-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Manage Biomarkers
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Subscribers Tab Component
function SubscribersTab({
  subscribers,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onRefresh,
  onExport,
  onDelete,
  formatDate,
  refreshing,
  currentPage,
  totalPages,
  totalItems,
  setCurrentPage
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">
          Email Subscribers <span className="text-neutral-500">({totalItems})</span>
        </h2>
        <div className="flex items-center space-x-3">
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onRefresh} size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Subscribed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                subscribers.map((sub: Subscriber) => (
                  <tr key={sub.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{sub.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${sub.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(sub.subscribed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {sub.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => onDelete(sub.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Users Tab Component
function UsersTab({
  users,
  searchTerm,
  setSearchTerm,
  onRefresh,
  onExport,
  onDelete,
  formatDate,
  refreshing,
  currentPage,
  totalPages,
  totalItems,
  setCurrentPage
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">
          Registered Users <span className="text-neutral-500">({totalItems})</span>
        </h2>
        <div className="flex items-center space-x-3">
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onRefresh} size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Consent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user: User) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {user.data_consent && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Data</span>
                        )}
                        {user.research_consent && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Research</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => onDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Documents Tab Component
function DocumentsTab({
  documents,
  statusFilter,
  setStatusFilter,
  onRefresh,
  onDelete,
  formatDate,
  formatFileSize,
  refreshing,
  currentPage,
  totalPages,
  totalItems,
  setCurrentPage
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">
          Documents <span className="text-neutral-500">({totalItems})</span>
        </h2>
        <Button onClick={onRefresh} size="sm" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="uploading">Uploading</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                documents.map((doc: Document) => (
                  <tr key={doc.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">{doc.filename}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {doc.users?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatFileSize(doc.filesize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${doc.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          doc.status === 'uploading' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(doc.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Analyses Tab Component
function AnalysesTab({
  analyses,
  onRefresh,
  onDelete,
  formatDate,
  refreshing,
  currentPage,
  totalPages,
  totalItems,
  setCurrentPage
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">
          Health Analyses <span className="text-neutral-500">({totalItems})</span>
        </h2>
        <Button onClick={onRefresh} size="sm" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Health Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No analyses found
                  </td>
                </tr>
              ) : (
                analyses.map((analysis: Analysis) => (
                  <tr key={analysis.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {analysis.users?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                      {analysis.documents?.filename || 'Manual'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-neutral-900">{analysis.overall_health_score}/100</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
                        ${analysis.health_category === 'excellent' ? 'bg-green-100 text-green-800' : 
                          analysis.health_category === 'good' ? 'bg-blue-100 text-blue-800' :
                          analysis.health_category === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {analysis.health_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(analysis.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => onDelete(analysis.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Biomarkers Tab Component
function BiomarkersTab({
  biomarkers,
  categories,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  onRefresh,
  refreshing,
  currentPage,
  totalPages,
  totalItems,
  setCurrentPage
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-neutral-800">
          Biomarkers <span className="text-neutral-500">({totalItems})</span>
        </h2>
        <Button onClick={onRefresh} size="sm" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search biomarkers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {biomarkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No biomarkers found
                  </td>
                </tr>
              ) : (
                biomarkers.map((biomarker: Biomarker) => (
                  <tr key={biomarker.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{biomarker.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {biomarker.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {biomarker.unit || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${biomarker.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {biomarker.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {new Date(biomarker.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }: any) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-neutral-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

