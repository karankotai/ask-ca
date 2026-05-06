"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";

type Props = {
  data: Array<{ name: string; value: number; isFlagged: boolean }>;
  threshold: number;
};

export default function ConcentrationChart({ data, threshold }: Props) {
  return (
    <div style={{ height: 240, width: "100%" }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            stroke="#e5e7eb"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 12, fill: "#4b5563" }}
            stroke="#e5e7eb"
          />
          <Tooltip
            formatter={(v) => `${v}%`}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
            }}
          />
          <ReferenceLine x={threshold} stroke="#dc2626" strokeDasharray="3 3" label={{ value: `${threshold}%`, fontSize: 10, fill: "#dc2626", position: "top" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.isFlagged ? "#dc2626" : d.value >= threshold ? "#d97706" : "#6366f1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
