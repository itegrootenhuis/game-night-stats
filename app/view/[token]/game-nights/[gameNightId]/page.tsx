'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Trophy, 
  Loader2, 
  Gamepad2, 
  MessageSquare, 
  Send, 
  ChevronDown,
  Eye,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Player {
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

interface GameNight {
  id: string
  name: string
  date: string
  ownerName: string
  gameSessions: GameSession[]
  comments: Comment[]
}

export default function VisitorGameNightPage({ 
  params 
}: { 
  params: Promise<{ token: string; gameNightId: string }> 
}) {
  const { token, gameNightId } = use(params)
  const [gameNight, setGameNight] = useState<GameNight | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gamesCollapsed, setGamesCollapsed] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(false)
  
  // Comment form state
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [selectedSessionForComment, setSelectedSessionForComment] = useState<string>('')
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    fetchData()
  }, [token, gameNightId])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/view/${token}/game-nights/${gameNightId}`)
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to load game night')
        return
      }

      const data = await res.json()
      setGameNight(data)
      setComments(data.comments || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load game night')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setAddingComment(true)
    try {
      const res = await fetch(`/api/view/${token}/game-nights/${gameNightId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          gameSessionId: selectedSessionForComment || undefined,
          authorName: authorName.trim() || undefined
        })
      })

      if (res.ok) {
        const comment = await res.json()
        setComments([comment, ...comments])
        setNewComment('')
        setSelectedSessionForComment('')
        toast.success('Comment added!')
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

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to View Game Night</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </main>
    )
  }

  if (!gameNight) return null

  return (
    <main className="min-h-screen p-4 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Visitor Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/20 text-teal-400 text-sm">
            <Eye className="w-4 h-4" />
            Visitor View
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href={`/view/${token}`}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{gameNight.name}</h1>
            <p className="text-sm text-zinc-500">{formatDate(gameNight.date)} · {gameNight.ownerName}'s game night</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Games List */}
          <div>
            <button
              onClick={() => setGamesCollapsed(!gamesCollapsed)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Games ({gameNight.gameSessions.length})
              </h2>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${gamesCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!gamesCollapsed && (
              <>
                {gameNight.gameSessions.length > 0 ? (
                  <div className="space-y-3">
                    {gameNight.gameSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Gamepad2 className="w-5 h-5 text-teal-400" />
                          <h3 className="font-semibold text-white">{session.game.name}</h3>
                        </div>
                        
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 border-dashed p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No games recorded yet</p>
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
            <button
              onClick={() => setNotesCollapsed(!notesCollapsed)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes & Comments ({comments.length})
              </h2>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${notesCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!notesCollapsed && (
              <>
                {/* Add Comment Form */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 mb-4">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition mb-2"
                  />
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
                        <p className="text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 border-dashed p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">No notes yet</p>
                    <p className="text-zinc-600 text-xs mt-1">Be the first to add a note!</p>
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
      </div>
    </main>
  )
}
