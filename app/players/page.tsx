'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, X, Trophy, Target, Loader2, Pencil, Check } from 'lucide-react'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  color?: string | null
  avatarUrl?: string | null
  stats: {
    totalGames: number
    wins: number
    winRate: number
  }
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ id: string; name: string; color?: string | null; avatarUrl?: string | null } | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#0d7377')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [newPlayerColor, setNewPlayerColor] = useState('#0d7377')
  const [newPlayerAvatarUrl, setNewPlayerAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players')
      if (res.ok) {
        const data = await res.json()
        setPlayers(data)
      }
    } catch (err) {
      console.error('Failed to fetch players:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPlayerName.trim(),
          color: newPlayerColor || null,
          avatarUrl: newPlayerAvatarUrl.trim() || null
        })
      })

      if (res.ok) {
        toast.success(`${newPlayerName.trim()} added successfully!`)
        setNewPlayerName('')
        setNewPlayerColor('#0d7377')
        setNewPlayerAvatarUrl('')
        setShowAddPlayer(false)
        fetchPlayers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add player')
        toast.error(data.error || 'Failed to add player')
      }
    } catch (err) {
      console.error('Failed to add player:', err)
      setError('Failed to add player')
      toast.error('Failed to add player')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDeletePlayer = async () => {
    if (!deleteConfirm) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/players/${deleteConfirm.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setPlayers(players.filter(p => p.id !== deleteConfirm.id))
        toast.success(`${deleteConfirm.name} removed`)
        setDeleteConfirm(null)
      } else {
        toast.error('Failed to remove player')
      }
    } catch (err) {
      console.error('Failed to remove player:', err)
      toast.error('Failed to remove player')
    } finally {
      setDeleting(false)
    }
  }

  const startEditing = (player: Player) => {
    setEditingPlayer({ 
      id: player.id, 
      name: player.name,
      color: player.color,
      avatarUrl: player.avatarUrl
    })
    setEditName(player.name)
    setEditColor(player.color || '#0d7377')
    setEditAvatarUrl(player.avatarUrl || '')
  }

  const cancelEditing = () => {
    setEditingPlayer(null)
    setEditName('')
    setEditColor('#0d7377')
    setEditAvatarUrl('')
  }

  const saveEdit = async () => {
    if (!editingPlayer || !editName.trim()) return
    
    // Check if anything has changed
    const nameChanged = editName.trim() !== editingPlayer.name
    const colorChanged = editColor !== (editingPlayer.color || '#0d7377')
    const avatarChanged = editAvatarUrl.trim() !== (editingPlayer.avatarUrl || '')
    
    if (!nameChanged && !colorChanged && !avatarChanged) {
      cancelEditing()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editName.trim(),
          color: editColor || null,
          avatarUrl: editAvatarUrl.trim() || null
        })
      })

      if (res.ok) {
        setPlayers(players.map(p => 
          p.id === editingPlayer.id ? { 
            ...p, 
            name: editName.trim(),
            color: editColor || null,
            avatarUrl: editAvatarUrl.trim() || null
          } : p
        ))
        toast.success('Player updated')
        cancelEditing()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update player')
      }
    } catch (err) {
      console.error('Failed to update player:', err)
      toast.error('Failed to update player')
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
              <Skeleton className="h-7 w-24" />
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
            <h1 className="text-2xl font-bold text-white">Players</h1>
          </div>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Add Player Form */}
        {showAddPlayer && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Enter player name"
                autoFocus
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
              />
              <button
                onClick={handleAddPlayer}
                disabled={submitting || !newPlayerName.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => { 
                  setShowAddPlayer(false); 
                  setNewPlayerName(''); 
                  setNewPlayerColor('#0d7377');
                  setNewPlayerAvatarUrl('');
                  setError('') 
                }}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newPlayerColor}
                    onChange={(e) => setNewPlayerColor(e.target.value)}
                    className="w-12 h-10 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newPlayerColor}
                    onChange={(e) => setNewPlayerColor(e.target.value)}
                    placeholder="#0d7377"
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={newPlayerAvatarUrl}
                  onChange={(e) => setNewPlayerAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {/* Players List */}
        {players.length > 0 ? (
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ 
                      backgroundColor: (player.avatarUrl && !imageErrors[player.id]) ? 'transparent' : (player.color || '#0d7377')
                    }}
                  >
                    {player.avatarUrl && !imageErrors[player.id] ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [player.id]: true }))
                        }}
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {(editingPlayer?.id === player.id ? editName : player.name).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingPlayer?.id === player.id ? (
                      <div className="space-y-3">
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                className="w-10 h-8 rounded bg-zinc-800 border border-zinc-700 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                className="flex-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Avatar URL</label>
                            <input
                              type="url"
                              value={editAvatarUrl}
                              onChange={(e) => setEditAvatarUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-white">{player.name}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> {player.stats.wins} wins
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" /> {player.stats.totalGames} games
                          </span>
                          {player.stats.totalGames > 0 && (
                            <span className="text-teal-400">
                              {player.stats.winRate}% win rate
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {editingPlayer?.id !== player.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(player)}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: player.id, name: player.name })}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
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
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No players yet</p>
            <p className="text-sm text-zinc-600 mt-1 mb-4">
              Add players to track their stats
            </p>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Player"
        description={`Are you sure you want to delete ${deleteConfirm?.name}? This will also remove all their game results.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeletePlayer}
        loading={deleting}
      />
    </main>
  )
}
