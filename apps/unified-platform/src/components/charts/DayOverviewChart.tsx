'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS: Record<string, string> = {
  Breakfast: '#f59e0b',
  Lunch: '#10b981',
  Snacks: '#ec4899',
  Dinner: '#6366f1',
}

export function DayOverviewChart({ data }: { data: Array<Record<string, string | number>> }) {
  const meals = Array.from(new Set(data.flatMap((row) => Object.keys(row).filter((key) => key !== 'day'))))
  return (
    <div className="w-full min-w-0 rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
      <h3 className="font-bold">Meals served by event day</h3>
      <p className="mb-4 text-xs text-[var(--color-on-surface-variant)]">Progressive slot totals</p>
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-surface-variant)" />
            <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            {meals.map((meal) => <Bar key={meal} dataKey={meal} fill={COLORS[meal] ?? '#964900'} radius={[4, 4, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function Empty() {
  return <div className="flex h-[250px] items-center justify-center text-sm text-[var(--color-on-surface-variant)]">Create food slots to populate this chart.</div>
}
