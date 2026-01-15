'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trophy, Loader2, X, Gamepad2, Users, Check, ChevronDown, Pencil, Trash2, MessageSquare, Send } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
}

interface Game {
  id: string
  name: string
}

interface GameResult {
  id: string
  position: number
  isWinner: boolean
  player: Player
}

interface GameSession {
  id: string
  game: {
    id: string
    name: string
  }
  results: GameResult[]
  createdAt: string
}

interface GameNight {
  id: string
  name: string
  date: string
  gameSessions: GameSession[]
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  gameSession?: {
    id: string
    game: {
      name: string
    }
  } | null
}

export default function GameNightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [gameNight, setGameNight] = useState<GameNight | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddGame, setShowAddGame] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState('')
  const [newGameName, setNewGameName] = useState('')
  const [showNewGameInput, setShowNewGameInput] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [winners, setWinners] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingSession, setEditingSession] = useState<GameSession | null>(null)
  const [editWinners, setEditWinners] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteSession, setDeleteSession] = useState<{ id: string; gameName: string } | null>(null)
  const [deletingSession, setDeletingSession] = useState(false)
  const [gamesCollapsed, setGamesCollapsed] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(false)
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedSessionForComment, setSelectedSessionForComment] = useState<string>('')
  const [addingComment, setAddingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [deleteComment, setDeleteComment] = useState<{ id: string } | null>(null)
  const [deletingComment, setDeletingComment] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [gameNightRes, playersRes, gamesRes, commentsRes] = await Promise.all([
        fetch(`/api/game-nights/${id}`),
        fetch('/api/players'),
        fetch('/api/games'),
        fetch(`/api/game-nights/${id}/comments`)
      ])

      if (gameNightRes.ok) {
        const data = await gameNightRes.json()
        setGameNight(data)
      }

      if (playersRes.ok) {
        const data = await playersRes.json()
        setAllPlayers(data)
      }

      if (gamesRes.ok) {
        const data = await gamesRes.json()
        setAllGames(data)
      }

      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(pid => pid !== playerId))
      setWinners(winners.filter(pid => pid !== playerId))
    } else {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const toggleWinner = (playerId: string) => {
    if (winners.includes(playerId)) {
      setWinners(winners.filter(pid => pid !== playerId))
    } else {
      setWinners([...winners, playerId])
    }
  }

  const getGameName = () => {
    if (showNewGameInput && newGameName.trim()) {
      return newGameName.trim()
    }
    if (selectedGameId) {
      const game = allGames.find(g => g.id === selectedGameId)
      return game?.name || ''
    }
    return ''
  }

  const handleAddGame = async () => {
    const gameName = getGameName()
    
    if (!gameName) {
      setError('Please select a game or enter a new game name')
      return
    }

    if (selectedPlayers.length < 2) {
      setError('Please select at least 2 players')
      return
    }

    if (winners.length === 0) {
      setError('Please select at least one winner')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const results = selectedPlayers.map((playerId, index) => ({
        playerId,
        position: winners.includes(playerId) ? 1 : index + 2,
        isWinner: winners.includes(playerId)
      }))

      const res = await fetch(`/api/game-nights/${id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName,
          results
        })
      })

      if (res.ok) {
        resetForm()
        setShowAddGame(false)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add game')
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      setError('Failed to add game')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedGameId('')
    setNewGameName('')
    setShowNewGameInput(false)
    setSelectedPlayers([])
    setWinners([])
    setError('')
  }

  const startEditingSession = (session: GameSession) => {
    setEditingSession(session)
    setEditWinners(session.results.filter(r => r.isWinner).map(r => r.player.id))
  }

  const cancelEditingSession = () => {
    setEditingSession(null)
    setEditWinners([])
  }

  const toggleEditWinner = (playerId: string) => {
    if (editWinners.includes(playerId)) {
      setEditWinners(editWinners.filter(id => id !== playerId))
    } else {
      setEditWinners([...editWinners, playerId])
    }
  }

  const saveSessionEdit = async () => {
    if (!editingSession || editWinners.length === 0) {
      toast.error('Please select at least one winner')
      return
    }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/game-nights/${id}/sessions/${editingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerIds: editWinners })
      })

      if (res.ok) {
        toast.success('Game updated')
        fetchData()
        cancelEditingSession()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update game')
      }
    } catch (err) {
      console.error('Failed to update session:', err)
      toast.error('Failed to update game')
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDeleteSession = async () => {
    if (!deleteSession) return

    setDeletingSession(true)
    try {
      const res = await fetch(`/api/game-nights/${id}/sessions/${deleteSession.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success(`${deleteSession.gameName} removed`)
        fetchData()
        setDeleteSession(null)
      } else {
        toast.error('Failed to delete game')
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
      toast.error('Failed to delete game')
    } finally {
      setDeletingSession(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setAddingComment(true)
    try {
      const res = await fetch(`/api/game-nights/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          gameSessionId: selectedSessionForComment || undefined
        })
      })

      if (res.ok) {
        const comment = await res.json()
        setComments([comment, ...comments])
        setNewComment('')
        setSelectedSessionForComment('')
        toast.success('Comment added')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add comment')
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
      toast.error('Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }

  const cancelEditingComment = () => {
    setEditingCommentId(null)
    setEditCommentContent('')
  }

  const saveCommentEdit = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return

    setSavingComment(true)
    try {
      const res = await fetch(`/api/game-nights/${id}/comments/${editingCommentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent.trim() })
      })

      if (res.ok) {
        const updatedComment = await res.json()
        setComments(comments.map(c => c.id === editingCommentId ? updatedComment : c))
        cancelEditingComment()
        toast.success('Comment updated')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update comment')
      }
    } catch (err) {
      console.error('Failed to update comment:', err)
      toast.error('Failed to update comment')
    } finally {
      setSavingComment(false)
    }
  }

  const confirmDeleteComment = async () => {
    if (!deleteComment) return

    setDeletingComment(true)
    try {
      const res = await fetch(`/api/game-nights/${id}/comments/${deleteComment.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setComments(comments.filter(c => c.id !== deleteComment.id))
        setDeleteComment(null)
        toast.success('Comment deleted')
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (err) {
      console.error('Failed to delete comment:', err)
      toast.error('Failed to delete comment')
    } finally {
      setDeletingComment(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </main>
    )
  }

  if (!gameNight) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <p className="text-zinc-500">Game night not found</p>
          <Link href="/game-nights" className="text-teal-400 hover:text-teal-300 mt-2 inline-block">
            Back to Game Nights
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/game-nights"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{gameNight.name}</h1>
            <p className="text-sm text-zinc-500">{formatDate(gameNight.date)}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Games List */}
          <div>
            <div className="flex items-center justify-between mb-3 h-[34px]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  Games ({gameNight.gameSessions.length})
                </h2>
                <button
                  onClick={() => setGamesCollapsed(!gamesCollapsed)}
                  className="p-1 rounded hover:bg-zinc-800 transition"
                >
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${gamesCollapsed ? '-rotate-90' : ''}`} />
                </button>
              </div>
              <button
                onClick={() => setShowAddGame(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Add Game
              </button>
            </div>

            {!gamesCollapsed && (
              <>
                {gameNight.gameSessions.length > 0 ? (
                  <div className="space-y-3">
                    {gameNight.gameSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5 text-teal-400" />
                            <h3 className="font-semibold text-white">{session.game.name}</h3>
                          </div>
                          {editingSession?.id !== session.id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditingSession(session)}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                                title="Edit winner"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteSession({ id: session.id, gameName: session.game.name })}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                                title="Delete game"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {editingSession?.id === session.id ? (
                          <div className="space-y-3">
                            <p className="text-sm text-zinc-400">Select winner(s):</p>
                            <div className="space-y-2">
                              {session.results.map((result) => (
                                <button
                                  key={result.id}
                                  onClick={() => toggleEditWinner(result.player.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                                    editWinners.includes(result.player.id)
                                      ? 'bg-amber-500/20 border border-amber-500/50' 
                                      : 'bg-zinc-800/50 border border-transparent hover:border-zinc-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Trophy className={`w-4 h-4 ${
                                      editWinners.includes(result.player.id) ? 'text-amber-400' : 'text-zinc-600'
                                    }`} />
                                    <span className={editWinners.includes(result.player.id) ? 'text-amber-400 font-medium' : 'text-zinc-400'}>
                                      {result.player.name}
                                    </span>
                                  </div>
                                  {editWinners.includes(result.player.id) && (
                                    <Check className="w-4 h-4 text-amber-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={saveSessionEdit}
                                disabled={savingEdit || editWinners.length === 0}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Save
                              </button>
                              <button
                                onClick={cancelEditingSession}
                                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {session.results.map((result) => (
                              <div
                                key={result.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                                  result.isWinner 
                                    ? 'bg-amber-500/10 border border-amber-500/20' 
                                    : 'bg-zinc-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {result.isWinner && <Trophy className="w-4 h-4 text-amber-400" />}
                                  <span className={result.isWinner ? 'text-amber-400 font-medium' : 'text-zinc-400'}>
                                    {result.player.name}
                                  </span>
                                </div>
                                {result.isWinner && (
                                  <span className="text-xs text-amber-400/70 uppercase tracking-wider">Winner</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 border-dashed p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No games recorded yet</p>
                    <p className="text-sm text-zinc-600 mt-1">Add your first game below</p>
                  </div>
                )}
              </>
            )}

            {gamesCollapsed && gameNight.gameSessions.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                <p className="text-zinc-500 text-sm">
                  {gameNight.gameSessions.length} game{gameNight.gameSessions.length !== 1 ? 's' : ''} recorded
                </p>
                <button
                  onClick={() => setGamesCollapsed(false)}
                  className="text-teal-400 hover:text-teal-300 text-sm mt-1"
                >
                  Show games →
                </button>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center justify-between mb-3 h-[34px]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes & Comments ({comments.length})
                </h2>
                <button
                  onClick={() => setNotesCollapsed(!notesCollapsed)}
                  className="p-1 rounded hover:bg-zinc-800 transition"
                >
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${notesCollapsed ? '-rotate-90' : ''}`} />
                </button>
              </div>
            </div>

            {!notesCollapsed && (
              <>
                {/* Add Comment Form */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a note about this game night..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition resize-none"
                  />
                  
                  {/* Optional: Link to specific game */}
                  {gameNight.gameSessions.length > 0 && (
                    <div className="mt-2">
                      <select
                        value={selectedSessionForComment}
                        onChange={(e) => setSelectedSessionForComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm focus:outline-none focus:border-teal-500 transition"
                      >
                        <option value="">General note (no specific game)</option>
                        {gameNight.gameSessions.map((session, index) => (
                          <option key={session.id} value={session.id}>
                            About: {session.game.name}{gameNight.gameSessions.filter(s => s.game.name === session.game.name).length > 1 ? ` (Round ${gameNight.gameSessions.filter(s => s.game.name === session.game.name).findIndex(s => s.id === session.id) + 1})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddComment}
                      disabled={addingComment || !newComment.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                    >
                      {addingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                      >
                        {editingCommentId === comment.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-teal-500 transition resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveCommentEdit}
                                disabled={savingComment || !editCommentContent.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save
                              </button>
                              <button
                                onClick={cancelEditingComment}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-zinc-300 whitespace-pre-wrap flex-1">{comment.content}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => startEditingComment(comment)}
                                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteComment({ id: comment.id })}
                                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                              <span>{formatCommentDate(comment.createdAt)}</span>
                              {comment.gameSession && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Gamepad2 className="w-3 h-3" />
                                    {comment.gameSession.game.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 border-dashed p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">No notes yet</p>
                    <p className="text-zinc-600 text-xs mt-1">Add notes about memorable moments or funny stories</p>
                  </div>
                )}
              </>
            )}

            {notesCollapsed && comments.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                <p className="text-zinc-500 text-sm">
                  {comments.length} note{comments.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setNotesCollapsed(false)}
                  className="text-teal-400 hover:text-teal-300 text-sm mt-1"
                >
                  Show notes →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Game Modal/Form */}
        {showAddGame && (
          <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Add Game</h2>
                <button
                  onClick={() => {
                    setShowAddGame(false)
                    resetForm()
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Game Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Gamepad2 className="w-4 h-4 inline mr-1" />
                    Select Game
                  </label>
                  
                  {!showNewGameInput ? (
                    <>
                      {allGames.length > 0 ? (
                        <div className="relative mb-2">
                          <select
                            value={selectedGameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                            className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white appearance-none focus:outline-none focus:border-teal-500 transition cursor-pointer"
                          >
                            <option value="">Choose a game...</option>
                            {allGames.map(game => (
                              <option key={game.id} value={game.id}>{game.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 mb-2">No games added yet</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewGameInput(true)
                          setSelectedGameId('')
                        }}
                        className="text-sm text-teal-400 hover:text-teal-300 transition"
                      >
                        + Add new game
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value)}
                        placeholder="Enter game name (e.g., Catan)"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition mb-2"
                      />
                      {allGames.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewGameInput(false)
                            setNewGameName('')
                          }}
                          className="text-sm text-zinc-400 hover:text-zinc-300 transition"
                        >
                          ← Select existing game
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Select Players */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Who played? ({selectedPlayers.length} selected)
                  </label>
                  {allPlayers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {allPlayers.map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => togglePlayer(player.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                            selectedPlayers.includes(player.id)
                              ? 'bg-teal-600/20 border-teal-500 text-white'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selectedPlayers.includes(player.id)
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-zinc-600'
                          }`}>
                            {selectedPlayers.includes(player.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="truncate">{player.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-zinc-500 text-sm mb-2">No players added yet</p>
                      <Link 
                        href="/players" 
                        className="text-teal-400 hover:text-teal-300 text-sm"
                      >
                        Add players first →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Select Winners */}
                {selectedPlayers.length >= 2 && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      <Trophy className="w-4 h-4 inline mr-1" />
                      Who won? (select all winners)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPlayers.map((playerId) => {
                        const player = allPlayers.find(p => p.id === playerId)
                        if (!player) return null
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => toggleWinner(player.id)}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                              winners.includes(player.id)
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                            }`}
                          >
                            <Trophy className={`w-4 h-4 ${
                              winners.includes(player.id) ? 'text-amber-400' : 'text-zinc-600'
                            }`} />
                            <span className="truncate">{player.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleAddGame}
                  disabled={submitting || !getGameName() || selectedPlayers.length < 2 || winners.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Game
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete Game Session Confirmation */}
      <ConfirmDialog
        open={!!deleteSession}
        onOpenChange={(open) => !open && setDeleteSession(null)}
        title="Delete Game"
        description={`Are you sure you want to delete ${deleteSession?.gameName}? This will remove all results for this game.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteSession}
        loading={deletingSession}
      />

      {/* Delete Comment Confirmation */}
      <ConfirmDialog
        open={!!deleteComment}
        onOpenChange={(open) => !open && setDeleteComment(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteComment}
        loading={deletingComment}
      />
    </main>
  )
}
