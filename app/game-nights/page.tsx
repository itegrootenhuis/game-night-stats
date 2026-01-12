'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Plus, Trash2, Gamepad2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from 'sonner'

interface GameNight {
  id: string
  name: string
  date: string
  stats: {
    totalGames: number
    playerCount: number
    players: string[]
  }
}

export default function GameNightsPage() {
  const [gameNights, setGameNights] = useState<GameNight[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingGameNight, setEditingGameNight] = useState<{ id: string; name: string; date: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGameNights()
  }, [])

  const fetchGameNights = async () => {
    try {
      const res = await fetch('/api/game-nights')
      if (res.ok) {
        const data = await res.json()
        setGameNights(data)
      }
    } catch (err) {
      console.error('Failed to fetch game nights:', err)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/game-nights/${deleteConfirm.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGameNights(gameNights.filter(gn => gn.id !== deleteConfirm.id))
        toast.success(`${deleteConfirm.name} deleted`)
        setDeleteConfirm(null)
      } else {
        toast.error('Failed to delete game night')
      }
    } catch (err) {
      console.error('Failed to delete game night:', err)
      toast.error('Failed to delete game night')
    } finally {
      setDeleting(false)
    }
  }

  const startEditing = (gameNight: GameNight) => {
    setEditingGameNight({ 
      id: gameNight.id, 
      name: gameNight.name, 
      date: new Date(gameNight.date).toISOString().split('T')[0]
    })
    setEditName(gameNight.name)
    setEditDate(new Date(gameNight.date).toISOString().split('T')[0])
  }

  const cancelEditing = () => {
    setEditingGameNight(null)
    setEditName('')
    setEditDate('')
  }

  const saveEdit = async () => {
    if (!editingGameNight || !editName.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/game-nights/${editingGameNight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editName.trim(),
          date: editDate
        })
      })

      if (res.ok) {
        setGameNights(gameNights.map(gn => 
          gn.id === editingGameNight.id 
            ? { ...gn, name: editName.trim(), date: new Date(editDate).toISOString() } 
            : gn
        ))
        toast.success('Game night updated')
        cancelEditing()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update game night')
      }
    } catch (err) {
      console.error('Failed to update game night:', err)
      toast.error('Failed to update game night')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
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
            <h1 className="text-2xl font-bold text-white">Game Nights</h1>
          </div>
          <Link
            href="/game-nights/new"
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Game Nights List */}
        {gameNights.length > 0 ? (
          <div className="space-y-3">
            {gameNights.map((gameNight) => (
              <div
                key={gameNight.id}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-start justify-between mb-2">
                  {editingGameNight?.id === gameNight.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEditing()
                        }}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-teal-500"
                        placeholder="Game night name"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-teal-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving || !editName.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Link
                          href={`/game-nights/${gameNight.id}`}
                          className="text-lg font-semibold text-white hover:text-teal-400 transition"
                        >
                          {gameNight.name}
                        </Link>
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(gameNight.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(gameNight)}
                          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: gameNight.id, name: gameNight.name })}
                          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-4 h-4" />
                    {gameNight.stats.totalGames} games
                  </span>
                  <span>
                    {gameNight.stats.playerCount} players
                  </span>
                </div>
                
                {gameNight.stats.players.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gameNight.stats.players.map(player => (
                      <span
                        key={player}
                        className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400"
                      >
                        {player}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No game nights yet</p>
            <p className="text-sm text-zinc-600 mt-1 mb-4">
              Create your first game night to start tracking
            </p>
            <Link 
              href="/game-nights/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Game Night
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Game Night"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This will also remove all game sessions and results from this night.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </main>
  )
}
