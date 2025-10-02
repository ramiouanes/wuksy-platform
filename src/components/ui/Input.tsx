import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input