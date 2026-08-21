"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { modeUsageData, progressData, teacherInsightData } from "@/lib/demo-data";

const palette = ["#2F6B57", "#53BFA5", "#E76F61", "#F2B84B", "#5A8FD8"];

type ProgressChartPoint = {
  name: string;
  focus: number;
  concepts: number;
};

type ModeUsagePoint = {
  name: string;
  value: number;
};

export function ProgressAreaChart({ data = progressData }: { data?: ProgressChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 12, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="focusFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#53BFA5" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#53BFA5" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#DDE8E3" strokeDasharray="4 4" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="focus" stroke="#2F6B57" strokeWidth={3} fill="url(#focusFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ModeUsageChart({ data = modeUsageData }: { data?: ModeUsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={palette[index % palette.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TeacherInsightChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={teacherInsightData} layout="vertical" margin={{ left: 24, right: 16, top: 12, bottom: 0 }}>
        <CartesianGrid stroke="#DDE8E3" strokeDasharray="4 4" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis dataKey="concept" type="category" width={132} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="requests" fill="#2F6B57" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
