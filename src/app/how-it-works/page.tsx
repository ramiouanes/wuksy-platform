'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Upload, 
  Sparkles, 
  Leaf, 
  ArrowRight,
  FileText,
  Brain,
  Heart,
  Shield,
  Clock,
  CheckCircle,
  Activity,
  Camera,
  Search,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Results',
    description: 'Share your blood test results with us in any format - PDF reports, photos, or screenshots from lab portals.',
    details: [
      'Supports PDF documents and all image formats',
      'Secure, encrypted file upload',
      'Works with any lab or testing provider',
      'No need to manually enter values'
    ],
    color: 'primary'
  },
  {
    icon: Search,
    title: 'AI Analysis',
    description: 'Our thoughtful AI reviews your biomarkers with precision, considering your unique demographics and health profile.',
    details: [
      'Advanced OCR extracts biomarker values',
      'Claude AI analyzes patterns and relationships',
      'Personalized based on age, gender, lifestyle',
      'Evidence-based interpretation'
    ],
    color: 'secondary'
  },
  {
    icon: Brain,
    title: 'Root Cause Analysis',
    description: 'We identify potential underlying factors affecting your biomarkers, not just surface-level symptoms.',
    details: [
      'Identifies nutritional deficiencies',
      'Detects metabolic imbalances',
      'Considers lifestyle factors',
      'Holistic health perspective'
    ],
    color: 'sage'
  },
  {
    icon: Leaf,
    title: 'Personalized Guidance',
    description: 'Receive evidence-based supplement recommendations and lifestyle guidance tailored to your unique needs.',
    details: [
      'Precise supplement protocols',
      'Dosage and timing recommendations',
      'Scientific backing for all suggestions',
      'Lifestyle modification guidance'
    ],
    color: 'stone'
  }
]

const features = [
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your health data is encrypted and secure. We never share your information without explicit consent.'
  },
  {
    icon: Activity,
    title: 'Science-Based',
    description: 'Every recommendation is backed by peer-reviewed research and functional medicine principles.'
  },
  {
    icon: Clock,
    title: 'Fast Results',
    description: 'Get your comprehensive analysis in minutes, not weeks. No waiting for appointments.'
  },
  {
    icon: Heart,
    title: 'Holistic Approach',
    description: 'We look at the bigger picture, considering how all your biomarkers work together.'
  }
]

const faqs = [
  {
    question: 'How accurate is the AI analysis?',
    answer: 'Our AI system has been trained on thousands of blood test reports and uses Claude-3, one of the most advanced language models available. However, our analysis is educational and should complement, not replace, professional medical advice.'
  },
  {
    question: 'What types of blood tests can I upload?',
    answer: 'We support comprehensive metabolic panels, lipid panels, vitamin levels, hormone tests, thyroid panels, and more. If it\'s a standard blood test, we can likely analyze it.'
  },
  {
    question: 'How do you ensure my data is secure?',
    answer: 'We use bank-level encryption for all data transmission and storage. Your files are processed securely and can be deleted at any time from your dashboard.'
  },
  {
    question: 'Can I trust the supplement recommendations?',
    answer: 'All recommendations are based on peer-reviewed research and include scientific references. We provide evidence levels and encourage discussing any changes with your healthcare provider.'
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-4xl md:text-5xl font-light text-neutral-800 leading-tight">
              How <span className="zen-text font-medium">WUKSY</span> Works
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Transform your blood test confusion into clarity with our gentle, 
              AI-powered approach to personalized wellness.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-3">
                  Try It Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="text-sm text-neutral-500">
                Free analysis • 5 minutes to results
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              Your Journey to <span className="zen-text font-medium">Wellness</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our simple, four-step process transforms complex biomarker data into actionable insights.
            </p>
          </motion.div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <div className={`bg-${step.color}-100 p-4 rounded-full mr-4`}>
                      <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-500 mb-1">
                        Step {index + 1}
                      </div>
                      <h3 className="text-2xl font-medium text-neutral-800">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-neutral-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <Card className="p-8 bg-gradient-to-br from-neutral-50 to-white">
                    <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
                      <step.icon className={`h-16 w-16 text-${step.color}-400`} />
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 zen-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              Why Choose <span className="zen-text font-medium">WUKSY</span>?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              We've built the most thoughtful and comprehensive health analysis platform available.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
              >
                <Card className="p-8 h-full bg-white/80 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-neutral-800 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              See What You'll <span className="zen-text font-medium">Receive</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our comprehensive analysis provides clear, actionable insights about your health.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">
                Health Score
              </h3>
              <p className="text-neutral-600 mb-4">
                Get an overall wellness score based on your biomarker harmony.
              </p>
              <div className="text-3xl font-light text-green-600 mb-2">78</div>
              <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full inline-block">
                GOOD HEALTH
              </div>
            </Card>

            <Card className="p-6">
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <Activity className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">
                Biomarker Insights
              </h3>
              <p className="text-neutral-600 mb-4">
                Detailed analysis of each biomarker with clear explanations.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Vitamin D: Optimal</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>B12: Suboptimal</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="bg-sage-50 p-4 rounded-lg mb-4">
                <Leaf className="h-8 w-8 text-sage-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">
                Recommendations
              </h3>
              <p className="text-neutral-600 mb-4">
                Personalized supplement and lifestyle recommendations.
              </p>
              <div className="space-y-2">
                <div className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded">
                  Essential: Vitamin D3 2000 IU
                </div>
                <div className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded">
                  Beneficial: Omega-3 1000mg
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              Frequently Asked <span className="zen-text font-medium">Questions</span>
            </h2>
            <p className="text-lg text-neutral-600">
              Everything you need to know about using WUKSY.
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-lg text-neutral-600 max-w-xl mx-auto">
              Join thousands who have transformed their health understanding 
              with WUKSY's gentle, AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-3">
                  Start Your Free Analysis
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="text-neutral-500 text-sm">
                No subscription • Results in 5 minutes
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 