"use client"

interface SlotProgressBarProps {
  slotName: string
  served: number
  total: number
  isActive: boolean
}

export function SlotProgressBar({ slotName, served, total, isActive }: SlotProgressBarProps) {
  const pct = total > 0 ? Math.min(100, (served / total) * 100) : 0
  return (
    <div
      className="rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #964900 0%, #f58529 60%, #8639b4 100%)' }}
    >
      {/* Decorative background icon */}
      <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="white">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-300 animate-pulse' : 'bg-white/40'}`} />
            <p className="text-xs font-bold tracking-widest uppercase opacity-80">
              {isActive ? 'Live Now' : 'Last Active'}
            </p>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{slotName}</h2>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-[family-name:var(--font-display)]">{pct.toFixed(0)}%</p>
          <p className="text-xs opacity-70">filled</p>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-5xl font-bold font-[family-name:var(--font-display)] leading-none">{served}</span>
        <span className="text-base opacity-80">/ {total} meals served</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
          }}
        />
      </div>

      <div className="flex justify-between text-xs opacity-60 mt-1.5">
        <span>0</span>
        <span>{Math.round(total / 2)}</span>
        <span>{total} guests</span>
      </div>
    </div>
  )
}
