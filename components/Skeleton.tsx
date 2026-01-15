import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-800',
        className
      )}
      style={style}
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800 p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} 
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return <Skeleton className={cn('w-10 h-10 rounded-full', className)} />
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />
}

export function SkeletonWidget({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800 p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800 p-4', className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="h-[200px] flex items-end justify-around gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-8 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonLeaderboard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800 p-4', className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonRecentGames({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800 p-4', className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
