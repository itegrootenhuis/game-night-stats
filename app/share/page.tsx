'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ArrowLeft, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  QrCode, 
  Link as LinkIcon,
  X,
  Clock,
  Users
} from 'lucide-react'

interface ShareLink {
  id: string
  token: string
  name: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export default function SharePage() {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkExpiry, setNewLinkExpiry] = useState('')

  useEffect(() => {
    fetchShareLinks()
  }, [])

  async function fetchShareLinks() {
    try {
      const response = await fetch('/api/share')
      if (response.ok) {
        const data = await response.json()
        setShareLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createShareLink() {
    setCreating(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLinkName || null,
          expiresAt: newLinkExpiry || null
        })
      })

      if (response.ok) {
        const newLink = await response.json()
        setShareLinks(prev => [newLink, ...prev])
        setShowCreateModal(false)
        setNewLinkName('')
        setNewLinkExpiry('')
      }
    } catch (error) {
      console.error('Failed to create share link:', error)
    } finally {
      setCreating(false)
    }
  }

  async function deleteShareLink(id: string) {
    try {
      const response = await fetch(`/api/share/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShareLinks(prev => prev.filter(link => link.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete share link:', error)
    }
  }

  async function toggleShareLink(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/share/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        const updatedLink = await response.json()
        setShareLinks(prev => prev.map(link => 
          link.id === id ? updatedLink : link
        ))
      }
    } catch (error) {
      console.error('Failed to toggle share link:', error)
    }
  }

  function getShareUrl(token: string) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/view/${token}`
    }
    return `/view/${token}`
  }

  async function copyToClipboard(token: string) {
    const url = getShareUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date() > new Date(expiresAt)
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Share Your Stats</h1>
              <p className="text-sm text-zinc-400">Create links to share your game night stats with friends</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Link</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-teal-600/10 border border-teal-500/20">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-teal-400 mt-0.5" />
            <div>
              <p className="text-sm text-teal-300 font-medium">Read-only access</p>
              <p className="text-sm text-zinc-400 mt-1">
                Anyone with a share link can view your stats but cannot make changes. 
                You can revoke access anytime by deleting or deactivating the link.
              </p>
            </div>
          </div>
        </div>

        {/* Share Links List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : shareLinks.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-zinc-900 border border-zinc-800">
            <LinkIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No share links yet</h3>
            <p className="text-zinc-400 mb-4">Create a link to share your stats with friends</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Share Link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map(link => (
              <div
                key={link.id}
                className={`rounded-xl bg-zinc-900 border ${
                  !link.isActive || isExpired(link.expiresAt)
                    ? 'border-zinc-700 opacity-60'
                    : 'border-zinc-800'
                } p-4`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {link.name || 'Unnamed Link'}
                      </h3>
                      {!link.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded bg-zinc-700 text-zinc-400">
                          Inactive
                        </span>
                      )}
                      {link.isActive && isExpired(link.expiresAt) && (
                        <span className="px-2 py-0.5 text-xs rounded bg-red-900/50 text-red-400">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 truncate mb-2">
                      {getShareUrl(link.token)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>Created {formatDate(link.createdAt)}</span>
                      {link.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {formatDate(link.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQRModal(link.token)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
                      title="Show QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(link.token)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
                      title="Copy Link"
                    >
                      {copiedId === link.token ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleShareLink(link.id, link.isActive)}
                      className={`p-2 rounded-lg transition ${
                        link.isActive
                          ? 'bg-teal-600/20 text-teal-400 hover:bg-teal-600/30'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title={link.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <LinkIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteShareLink(link.id)}
                      className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Create Share Link</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Link Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="e.g., Share with John"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Expiration Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newLinkExpiry}
                    onChange={(e) => setNewLinkExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createShareLink}
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">QR Code</h2>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-lg mb-4">
                <QRCodeSVG
                  value={getShareUrl(showQRModal)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-sm text-zinc-400 text-center mb-4">
                Scan this QR code to view the shared stats
              </p>

              <button
                onClick={() => {
                  copyToClipboard(showQRModal)
                  setShowQRModal(null)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Link Instead
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
