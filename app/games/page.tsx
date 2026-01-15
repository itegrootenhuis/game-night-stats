'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Gamepad2, X, Trophy, Target, Loader2, Pencil, Check } from 'lucide-react'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from 'sonner'

interface Game {
  id: string
  name: string
  stats: {
    totalPlayed: number
  }
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [newGameName, setNewGameName] = useState('')
  const [showAddGame, setShowAddGame] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingGame, setEditingGame] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games')
      if (res.ok) {
        const data = await res.json()
        setGames(data)
      }
    } catch (err) {
      console.error('Failed to fetch games:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGame = async () => {
    if (!newGameName.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGameName.trim() })
      })

      if (res.ok) {
        toast.success(`${newGameName.trim()} added successfully!`)
        setNewGameName('')
        setShowAddGame(false)
        fetchGames()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add game')
        toast.error(data.error || 'Failed to add game')
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      setError('Failed to add game')
      toast.error('Failed to add game')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDeleteGame = async () => {
    if (!deleteConfirm) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/games/${deleteConfirm.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGames(games.filter(g => g.id !== deleteConfirm.id))
        toast.success(`${deleteConfirm.name} removed`)
        setDeleteConfirm(null)
      } else {
        toast.error('Failed to remove game')
      }
    } catch (err) {
      console.error('Failed to remove game:', err)
      toast.error('Failed to remove game')
    } finally {
      setDeleting(false)
    }
  }

  const startEditing = (game: Game, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingGame({ id: game.id, name: game.name })
    setEditName(game.name)
  }

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditingGame(null)
    setEditName('')
  }

  const saveEdit = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!editingGame || !editName.trim()) return
    if (editName.trim() === editingGame.name) {
      cancelEditing()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/games/${editingGame.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })

      if (res.ok) {
        setGames(games.map(g => 
          g.id === editingGame.id ? { ...g, name: editName.trim() } : g
        ))
        toast.success('Game updated')
        cancelEditing()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update game')
      }
    } catch (err) {
      console.error('Failed to update game:', err)
      toast.error('Failed to update game')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Games</h1>
          </div>
          <button
            onClick={() => setShowAddGame(true)}
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Add Game Form */}
        {showAddGame && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGame()}
                placeholder="Enter game name (e.g., Catan)"
                autoFocus
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
              />
              <button
                onClick={handleAddGame}
                disabled={submitting || !newGameName.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddGame(false); setNewGameName(''); setError('') }}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {/* Games List */}
        {games.length > 0 ? (
          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingGame?.id === game.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit()
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-teal-500"
                        />
                        <button
                          onClick={saveEdit}
                          disabled={saving || !editName.trim()}
                          className="p-1 rounded hover:bg-zinc-700 text-teal-400 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Link href={`/games/${game.id}`} className="block">
                        <p className="font-medium text-white group-hover:text-teal-400 transition">{game.name}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" /> {game.stats.totalPlayed} times played
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
                {editingGame?.id !== game.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => startEditing(game, e)}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteConfirm({ id: game.id, name: game.name })
                      }}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
            <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No games yet</p>
            <p className="text-sm text-zinc-600 mt-1 mb-4">
              Add games to track stats for each one
            </p>
            <button
              onClick={() => setShowAddGame(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Game
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Game"
        description={`Are you sure you want to delete ${deleteConfirm?.name}? This will also remove all game sessions for this game.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteGame}
        loading={deleting}
      />
    </main>
  )
}

