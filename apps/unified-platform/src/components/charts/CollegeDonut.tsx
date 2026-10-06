'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#f58529', '#8639b4', '#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#64748b']

export function CollegeDonut({ data }: { data: Array<{ college: string; count: number }> }) {
  const top = data.slice(0, 6)
  const remainder = data.slice(6).reduce((sum, item) => sum + item.count, 0)
  const chart = remainder ? [...top, { college: 'Others', count: remainder }] : top
  return (
    <div className="w-full min-w-0 rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
      <h3 className="font-bold">College distribution</h3>
      <p className="mb-4 text-xs text-[var(--color-on-surface-variant)]">{data.length} colleges represented</p>
      {chart.length === 0 ? <div className="flex h-52 items-center justify-center text-sm text-[var(--color-on-surface-variant)]">No participants yet.</div> : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={chart} dataKey="count" nameKey="college" innerRadius={55} outerRadius={88} paddingAngle={2}>{chart.map((item, index) => <Cell key={item.college} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">{chart.map((item, index) => <span key={item.college} className="rounded-full bg-[var(--color-surface-container)] px-2.5 py-1 text-[10px] font-bold"><i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{item.college} · {item.count}</span>)}</div>
        </>
      )}
    </div>
  )
}
