"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YieldPoint } from "@/lib/optimizations";

interface YieldChartProps {
  data: YieldPoint[];
}

export default function YieldChart({ data }: YieldChartProps) {
  return (
    <div data-testid="yield-chart" className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="yieldGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00C9B1" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#00C9B1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="label"
            interval={4}
            minTickGap={28}
            tick={{ fill: "#8fa7b9", fontSize: 12 }}
          />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid rgba(0, 201, 177, 0.18)",
              background: "rgba(4, 8, 13, 0.95)",
              color: "#f6fbff",
            }}
            formatter={(value) => [`${value}%`, "APY"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2de5da"
            strokeWidth={3}
            fill="url(#yieldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
