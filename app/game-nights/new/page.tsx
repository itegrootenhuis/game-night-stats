'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Plus, X, Loader2 } from 'lucide-react'

interface Player {
  id: string
  name: string
}

export default function NewGameNightPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [groupTag, setGroupTag] = useState('')
  const [existingGroupTags, setExistingGroupTags] = useState<string[]>([])
  const [showGroupTagDropdown, setShowGroupTagDropdown] = useState(false)

  useEffect(() => {
    fetchPlayers()
    fetchGroupTags()
  }, [])

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players')
      if (res.ok) {
        const data = await res.json()
        setAllPlayers(data)
      }
    } catch (err) {
      console.error('Failed to fetch players:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupTags = async () => {
    try {
      const res = await fetch('/api/game-nights/groups')
      if (res.ok) {
        const data = await res.json()
        setExistingGroupTags(data)
      }
    } catch (err) {
      console.error('Failed to fetch group tags:', err)
    }
  }

  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) return

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      })

      if (res.ok) {
        const player = await res.json()
        setAllPlayers([...allPlayers, player])
        setSelectedPlayerIds([...selectedPlayerIds, player.id])
        setNewPlayerName('')
        setShowAddPlayer(false)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add player')
      }
    } catch (err) {
      console.error('Failed to add player:', err)
      setError('Failed to add player')
    }
  }

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId))
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter a name for the game night')
      return
    }

    if (selectedPlayerIds.length < 2) {
      setError('Please select at least 2 players')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/game-nights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          date,
          playerIds: selectedPlayerIds,
          groupTag: groupTag.trim() || undefined
        })
      })

      if (res.ok) {
        const gameNight = await res.json()
        router.push(`/game-nights/${gameNight.id}`)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create game night')
      }
    } catch (err) {
      console.error('Failed to create game night:', err)
      setError('Failed to create game night')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <h1 className="text-2xl font-bold text-white">New Game Night</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Night Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Game Night Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Friday Night Games"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Group Tag (Optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Group Tag (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={groupTag}
                onChange={(e) => {
                  setGroupTag(e.target.value)
                  setShowGroupTagDropdown(true)
                }}
                onFocus={() => setShowGroupTagDropdown(true)}
                onBlur={() => setTimeout(() => setShowGroupTagDropdown(false), 200)}
                placeholder="e.g., Weekend Group, Work Friends"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition"
              />
              {showGroupTagDropdown && existingGroupTags.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {existingGroupTags
                    .filter(tag => tag.toLowerCase().includes(groupTag.toLowerCase()))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setGroupTag(tag)
                          setShowGroupTagDropdown(false)
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-zinc-800 transition text-sm"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Tag this game night to filter share links (e.g., "Weekend Group", "Work Friends")
            </p>
          </div>

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-400">
                Players ({selectedPlayerIds.length} selected)
              </label>
              <button
                type="button"
                onClick={() => setShowAddPlayer(true)}
                className="text-sm text-teal-400 hover:text-teal-300 transition"
              >
                + New Player
              </button>
            </div>

            {/* Add Player Input */}
            {showAddPlayer && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewPlayer())}
                  placeholder="Player name"
                  autoFocus
                  className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddNewPlayer}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddPlayer(false); setNewPlayerName('') }}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Player Selection */}
            {allPlayers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {allPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedPlayerIds.includes(player.id)
                        ? 'bg-teal-600/20 border-teal-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        selectedPlayerIds.includes(player.id)
                          ? 'bg-teal-600 text-white'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{player.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 border-dashed p-6 text-center">
                <p className="text-zinc-600 text-sm mb-2">No players added yet</p>
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(true)}
                  className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300"
                >
                  <Plus className="w-4 h-4" />
                  Add your first player
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !name.trim() || selectedPlayerIds.length < 2}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Game Night'
            )}
          </button>
          
          {selectedPlayerIds.length < 2 && selectedPlayerIds.length > 0 && (
            <p className="text-center text-sm text-zinc-500">
              Select at least 2 players to continue
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
