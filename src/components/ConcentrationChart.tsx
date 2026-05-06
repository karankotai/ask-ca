"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

type Props = {
  data: Array<{ name: string; value: number; isFlagged: boolean }>;
  threshold: number;
};

export default function ConcentrationChart({ data, threshold }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="value">
            {data.map((d, i) => (
              <Cell key={i} fill={d.isFlagged ? "#dc2626" : d.value >= threshold ? "#f59e0b" : "#64748b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 mt-1">Threshold: {threshold}% — bars at or above flagged amber/red.</div>
    </div>
  );
}
