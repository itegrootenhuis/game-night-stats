'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Loader2,
  FileJson,
  AlertTriangle,
  User,
  Shield
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [exporting, setExporting] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/export')
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()
      
      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `game-night-stats-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeletingAccount(true)
    try {
      // Delete user data from database
      const response = await fetch('/api/account', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      // Sign out
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setDeletingAccount(false)
      setShowDeleteAccount(false)
      setDeleteConfirmText('')
    }
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg md:max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Account Section */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-teal-600/20">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Data Export Section */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-sky-600/20">
              <FileJson className="w-5 h-5 text-sky-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Export Data</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Download all your game night data as a JSON file. This includes all players, 
            games, game nights, sessions, and results.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Privacy Section */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-600/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Your data is stored securely and is only accessible by you. 
            We do not share your data with third parties.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl bg-zinc-900 border border-red-900/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-600/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Once you delete your account, there is no going back. All your data will be 
            permanently removed including all players, games, game nights, and statistics.
          </p>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Delete Account</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccount(false)
                    setDeleteConfirmText('')
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
