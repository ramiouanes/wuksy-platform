import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', shadow = 'sm', children, ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl border border-neutral-200 transition-all duration-300',
          paddingClasses[padding],
          shadowClasses[shadow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card