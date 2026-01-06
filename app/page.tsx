'use client'

import Link from 'next/link'
import { Calendar, BarChart3, Users, Dice5 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img
              src="/logo.png"
              alt="Game Night Stats Logo"
              className="w-16 h-16 object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Night Stats</h1>
          <p className="text-zinc-400">Track wins, settle debates, crown champions</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 mt-8">
          <Link 
            href="/game-nights/new"
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-600 to-sky-500 hover:from-teal-500 hover:to-sky-400 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">New Game Night</h2>
              <p className="text-sm text-white/70">Start tracking tonight's games</p>
            </div>
          </Link>

          <Link 
            href="/dashboard"
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800">
              <BarChart3 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Dashboard</h2>
              <p className="text-sm text-zinc-400">View stats and leaderboards</p>
            </div>
          </Link>

          <Link 
            href="/game-nights"
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Game Nights</h2>
              <p className="text-sm text-zinc-400">Browse past sessions</p>
            </div>
          </Link>

          <Link 
            href="/players"
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Players</h2>
              <p className="text-sm text-zinc-400">Manage your crew</p>
            </div>
          </Link>

          <Link 
            href="/games"
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800">
              <Dice5 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Games</h2>
              <p className="text-sm text-zinc-400">Track stats per game</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
            <p className="text-zinc-500">No games recorded yet</p>
            <p className="text-sm text-zinc-600 mt-1">Start a game night to see activity here</p>
          </div>
        </div>
      </div>
    </main>
  )
}

