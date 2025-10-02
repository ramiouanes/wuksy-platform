'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  User, 
  Calendar, 
  Heart, 
  Shield, 
  Settings,
  Save,
  Edit3,
  ChevronDown,
  Info,
  Trash2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface DemographicProfile {
  gender: 'male' | 'female' | 'other' | ''
  date_of_birth: string
  ethnicity: string
  bmi: number | null
  health_conditions: string[]
  medications: string[]
  lifestyle_factors: {
    exercise_frequency: string
    diet_type: string
    smoking_status: string
    alcohol_consumption: string
    stress_level: string
  }
  supplement_preferences: {
    preferred_forms: string[]
    allergies: string[]
    budget_range: string
  }
}

export default function ProfilePage() {
  const { user, loading, session } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<DemographicProfile>({
    gender: '',
    date_of_birth: '',
    ethnicity: '',
    bmi: null,
    health_conditions: [],
    medications: [],
    lifestyle_factors: {
      exercise_frequency: '',
      diet_type: '',
      smoking_status: '',
      alcohol_consumption: '',
      stress_level: ''
    },
    supplement_preferences: {
      preferred_forms: [],
      allergies: [],
      budget_range: ''
    }
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCondition, setNewCondition] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newAllergy, setNewAllergy] = useState('')

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Load existing profile data
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        // Add authorization header if we have a session
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/profile', { headers })
        
        if (response.status === 401) {
          // Unauthorized, redirect to signin
          router.push('/auth/signin')
          return
        }

        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile(data.profile)
          }
        } else {
          throw new Error('Failed to load profile')
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, loading, session, router])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(profile)
      })

      if (response.status === 401) {
        // Unauthorized, redirect to signin
        router.push('/auth/signin')
        return
      }

      if (response.ok) {
        setIsEditing(false)
        setError('')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const addHealthCondition = () => {
    if (newCondition.trim()) {
      setProfile(prev => ({
        ...prev,
        health_conditions: [...prev.health_conditions, newCondition.trim()]
      }))
      setNewCondition('')
    }
  }

  const removeHealthCondition = (index: number) => {
    setProfile(prev => ({
      ...prev,
      health_conditions: prev.health_conditions.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }))
      setNewMedication('')
    }
  }

  const removeMedication = (index: number) => {
    setProfile(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile(prev => ({
        ...prev,
        supplement_preferences: {
          ...prev.supplement_preferences,
          allergies: [...prev.supplement_preferences.allergies, newAllergy.trim()]
        }
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    setProfile(prev => ({
      ...prev,
      supplement_preferences: {
        ...prev.supplement_preferences,
        allergies: prev.supplement_preferences.allergies.filter((_, i) => i !== index)
      }
    }))
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-neutral-800 mb-2">
                Profile Settings
              </h1>
              <p className="text-neutral-600">
                Manage your health information for personalized recommendations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card className="p-8">
                <h3 className="text-xl font-medium text-neutral-800 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Name
                    </label>
                    <Input
                      value={user.name}
                      disabled
                      className="bg-neutral-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-neutral-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value as any }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      disabled={!isEditing}
                    />
                    {profile.date_of_birth && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Age: {calculateAge(profile.date_of_birth)} years
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Ethnicity
                    </label>
                    <Input
                      value={profile.ethnicity}
                      onChange={(e) => setProfile(prev => ({ ...prev, ethnicity: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., Caucasian, African American, Asian..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      BMI (optional)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={profile.bmi || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, bmi: e.target.value ? parseFloat(e.target.value) : null }))}
                      disabled={!isEditing}
                      placeholder="e.g., 23.5"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Health Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-8">
                <h3 className="text-xl font-medium text-neutral-800 mb-6 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Health Conditions
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.health_conditions.map((condition, index) => (
                      <div key={index} className="flex items-center bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                        <span>{condition}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeHealthCondition(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        placeholder="Add health condition..."
                        onKeyPress={(e) => e.key === 'Enter' && addHealthCondition()}
                      />
                      <Button onClick={addHealthCondition} size="sm">
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Medications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="p-8">
                <h3 className="text-xl font-medium text-neutral-800 mb-6">
                  Current Medications
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.medications.map((medication, index) => (
                      <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <span>{medication}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeMedication(index)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        placeholder="Add medication..."
                        onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                      />
                      <Button onClick={addMedication} size="sm">
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Lifestyle Factors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="p-8">
                <h3 className="text-xl font-medium text-neutral-800 mb-6">
                  Lifestyle Factors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Exercise Frequency
                    </label>
                    <select
                      value={profile.lifestyle_factors.exercise_frequency}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        lifestyle_factors: { ...prev.lifestyle_factors, exercise_frequency: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select frequency</option>
                      <option value="never">Never</option>
                      <option value="1-2-times-week">1-2 times per week</option>
                      <option value="3-4-times-week">3-4 times per week</option>
                      <option value="5-6-times-week">5-6 times per week</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Diet Type
                    </label>
                    <select
                      value={profile.lifestyle_factors.diet_type}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        lifestyle_factors: { ...prev.lifestyle_factors, diet_type: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select diet</option>
                      <option value="standard">Standard</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Ketogenic</option>
                      <option value="paleo">Paleo</option>
                      <option value="mediterranean">Mediterranean</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Smoking Status
                    </label>
                    <select
                      value={profile.lifestyle_factors.smoking_status}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        lifestyle_factors: { ...prev.lifestyle_factors, smoking_status: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select status</option>
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Alcohol Consumption
                    </label>
                    <select
                      value={profile.lifestyle_factors.alcohol_consumption}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        lifestyle_factors: { ...prev.lifestyle_factors, alcohol_consumption: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select consumption</option>
                      <option value="never">Never</option>
                      <option value="rare">Rarely</option>
                      <option value="moderate">Moderate (1-2 drinks/week)</option>
                      <option value="regular">Regular (3-7 drinks/week)</option>
                      <option value="heavy">Heavy (8+ drinks/week)</option>
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Privacy Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Card className="p-6 bg-primary-50/50">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">
                      Privacy Protected
                    </h4>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Your health information is encrypted and secure. 
                      We use this data only to provide personalized 
                      recommendations and never share it without consent.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Supplement Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-6">
                  Supplement Preferences
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Budget Range
                    </label>
                    <select
                      value={profile.supplement_preferences.budget_range}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        supplement_preferences: { ...prev.supplement_preferences, budget_range: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                    >
                      <option value="">Select budget</option>
                      <option value="budget">Budget ($20-50/month)</option>
                      <option value="moderate">Moderate ($50-100/month)</option>
                      <option value="premium">Premium ($100+/month)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Allergies & Restrictions
                    </label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {profile.supplement_preferences.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                            <span>{allergy}</span>
                            {isEditing && (
                              <button
                                onClick={() => removeAllergy(index)}
                                className="ml-2 text-orange-500 hover:text-orange-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            placeholder="Add allergy..."
                            onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                          />
                          <Button onClick={addAllergy} size="sm">
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Data Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-6">
                  Data Management
                </h3>
                <div className="space-y-4">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Export My Data
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 