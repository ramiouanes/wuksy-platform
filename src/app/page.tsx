'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Sparkles, 
  Leaf, 
  ArrowRight,
  Heart,
  Clock,
  Shield,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  {
    icon: Upload,
    title: 'Upload Your Results',
    description: 'Simply share your blood test results with us in any format.',
  },
  {
    icon: Sparkles,
    title: 'AI Analysis',
    description: 'Our thoughtful AI reviews your biomarkers with care and precision.',
  },
  {
    icon: Leaf,
    title: 'Personalized Guidance',
    description: 'Receive thoughtful recommendations tailored to your unique needs.',
  },
]

const testimonials = [
  {
    name: 'Sarah',
    content: "WUKSY helped me understand my health in a way that felt calm and reassuring.",
    rating: 5
  },
  {
    name: 'Michael',
    content: "Finally, health insights that don't overwhelm. Simple, clear, and peaceful.",
    rating: 5
  },
  {
    name: 'Lisa',
    content: "The zen approach to health analysis is exactly what I needed.",
    rating: 5
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-light text-neutral-800 leading-tight">
                Find Peace in Your
                <span className="block zen-text font-medium">Health Journey</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                Transform confusion into clarity with mindful, AI-powered insights 
                that help you understand your body's wisdom.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-3">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="px-8 py-3">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="flex justify-center items-center gap-6 text-sm text-neutral-500 pt-8">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-500" />
                <span>Private & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary-500" />
                <span>Science-Based</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />
                <span>5 Minutes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              Simple Steps to <span className="zen-text font-medium">Wellness</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              A thoughtful approach to understanding your health, designed to bring clarity without complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="bg-primary-50 p-4 rounded-full">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-neutral-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6 text-sm font-medium zen-text">
                  Step {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 zen-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-800 mb-4">
              Stories of <span className="zen-text font-medium">Tranquility</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Discover how others have found peace and clarity in their health journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
              >
                <Card className="p-6 h-full bg-white/80 backdrop-blur-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-neutral-700 leading-relaxed mb-6">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="font-medium text-neutral-800">
                    {testimonial.name}
                  </div>
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
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-light text-neutral-800">
                Ready to Begin Your Journey?
              </h2>
              <p className="text-lg text-neutral-600 max-w-xl mx-auto">
                Take the first mindful step towards understanding your body's wisdom 
                and finding peace in your health journey.
              </p>
            </div>

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