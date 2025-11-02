import { cn } from '@/lib/utils'
import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    // Base classes now include active state for touch devices and minimum touch target
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95'
    
    // Enhanced variants with active states for touch devices
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md',
      secondary: 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border border-stone-200',
      outline: 'border border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400 active:bg-primary-100',
      ghost: 'text-primary-600 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100'
    }
    
    // Sizes with minimum 44px touch target for mobile accessibility
    const sizes = {
      sm: 'min-h-[44px] px-4 text-sm',  // Meets 44px touch target minimum
      md: 'min-h-[44px] px-6 text-base', // Default size
      lg: 'min-h-[48px] px-8 text-lg',   // Larger touch target for prominence
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button