'use client'

import { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  loading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
  children
}: ConfirmDialogProps) {
  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-amber-600 hover:bg-amber-500',
    default: 'bg-teal-600 hover:bg-teal-500'
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-start gap-4">
            {variant === 'danger' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            )}
            {variant === 'warning' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
            )}
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-white">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-zinc-400">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog.Close asChild>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                disabled={loading}
              >
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm()
              }}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${confirmButtonStyles[variant]}`}
            >
              {loading ? 'Loading...' : confirmText}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
