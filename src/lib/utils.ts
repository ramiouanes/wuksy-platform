import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateAge(birthDate: string | Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export function getBiomarkerStatus(value: number, optimalMin: number, optimalMax: number): {
  status: 'deficient' | 'suboptimal' | 'optimal' | 'excess' | 'concerning'
  severity: 'mild' | 'moderate' | 'severe' | null
} {
  if (value < optimalMin * 0.7) {
    return { status: 'deficient', severity: 'severe' }
  } else if (value < optimalMin * 0.85) {
    return { status: 'deficient', severity: 'moderate' }
  } else if (value < optimalMin) {
    return { status: 'suboptimal', severity: 'mild' }
  } else if (value <= optimalMax) {
    return { status: 'optimal', severity: null }
  } else if (value <= optimalMax * 1.2) {
    return { status: 'excess', severity: 'mild' }
  } else if (value <= optimalMax * 1.5) {
    return { status: 'excess', severity: 'moderate' }
  } else {
    return { status: 'concerning', severity: 'severe' }
  }
}

export function formatProcessingTime(milliseconds: number): string {
  const totalSeconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  if (minutes === 0) {
    return `${seconds}s`
  }
  
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}