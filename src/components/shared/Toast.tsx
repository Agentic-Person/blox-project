'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  }

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  }

  return (
    <div
      className={`${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } transition-all duration-300 min-w-[300px] max-w-md bg-blox-black-blue border ${
        colors[type]
      } rounded-lg shadow-lg p-4`}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <p className="font-semibold text-blox-white">{title}</p>
          {description && (
            <p className="text-sm text-blox-off-white mt-1">{description}</p>
          )}
        </div>
        <Button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(id), 300)
          }}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
  }>>([])

  const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    duration?: number
  ) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, title, description, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    showToast,
    removeToast,
    success: (title: string, description?: string) => showToast('success', title, description),
    error: (title: string, description?: string) => showToast('error', title, description),
    warning: (title: string, description?: string) => showToast('warning', title, description),
    info: (title: string, description?: string) => showToast('info', title, description),
  }
}