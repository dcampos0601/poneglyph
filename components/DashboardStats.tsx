import React from "react";

interface StatsProps {
  title: string;
  value: string | number;
  trend: string;
  color: "blue" | "emerald" | "rose" | "amber" | "slate";
}

const colorStyles = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  slate: "bg-slate-50 text-slate-600 border-slate-100",
};

export function DashboardStats({ title, value, trend, color }: StatsProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
      </div>
      <div
        className={`mt-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorStyles[color]}`}
      >
        {trend}
      </div>
    </div>
  );
}
