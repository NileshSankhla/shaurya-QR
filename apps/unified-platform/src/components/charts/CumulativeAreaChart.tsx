'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function CumulativeAreaChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-3xl bg-[var(--color-primary)] p-5 text-white shadow-sm">
      <h3 className="font-bold">Cumulative verification</h3>
      <p className="mb-4 text-xs text-white/70">Running meal total over the latest 1,000 entries</p>
      {data.length === 0 ? <div className="flex h-52 items-center justify-center text-sm text-white/70">No verified meals yet.</div> : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs><linearGradient id="cumulative" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fff" stopOpacity={0.5} /><stop offset="95%" stopColor="#fff" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,.15)" vertical={false} />
            <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke="rgba(255,255,255,.7)" />
            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="rgba(255,255,255,.7)" />
            <Tooltip contentStyle={{ color: '#1a1c1c', borderRadius: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={3} fill="url(#cumulative)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
