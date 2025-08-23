import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-blox-glass-border bg-blox-glass-teal px-3 py-2 text-sm text-blox-white placeholder:text-blox-medium-blue-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blox-teal focus-visible:ring-offset-2 focus-visible:ring-offset-blox-very-dark-blue disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }