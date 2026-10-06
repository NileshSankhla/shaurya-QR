'use client'

const COLORS: Record<string, string> = {
  Breakfast: '#f59e0b',
  Lunch: '#10b981',
  Snacks: '#ec4899',
  Dinner: '#6366f1',
}

export function SlotHeatmap({ data }: { data: Record<string, Record<string, number>> }) {
  const days = Object.keys(data)
  const meals = Array.from(new Set(days.flatMap((day) => Object.keys(data[day]))))
  const max = Math.max(1, ...days.flatMap((day) => meals.map((meal) => data[day][meal] ?? 0)))

  return (
    <div className="w-full min-w-0 rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
      <h3 className="font-bold">Slot heatmap</h3>
      <p className="mb-5 text-xs text-[var(--color-on-surface-variant)]">Darker cells have more verified meals</p>
      {days.length === 0 ? <div className="flex h-44 items-center justify-center text-sm text-[var(--color-on-surface-variant)]">No slot data yet.</div> : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[480px] gap-2" style={{ gridTemplateColumns: `100px repeat(${meals.length}, minmax(70px, 1fr))` }}>
            <div />
            {meals.map((meal) => <div key={meal} className="text-center text-[10px] font-black uppercase">{meal}</div>)}
            {days.map((day) => (
              <div key={day} className="contents">
                <div className="self-center text-xs font-bold">{day}</div>
                {meals.map((meal) => {
                  const value = data[day][meal] ?? 0
                  return (
                    <div key={meal} className="flex aspect-square items-center justify-center rounded-2xl text-xs font-black text-white" style={{ background: COLORS[meal] ?? '#964900', opacity: value ? 0.3 + (value / max) * 0.7 : 0.08 }}>
                      {value || '—'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
