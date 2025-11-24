"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { DashboardStats } from "../components/DashboardStats";

type WorkStatus = "PENDING" | "IN_PROGRESS" | "CLOSED_IN_HUBSPOT" | "LOST";
type Lead = {
  id: string;
  fullName: string;
  title: string | null;
  account: { name: string; market: string | null };
  workStatus: WorkStatus;
  priority: string;
  hubspotContactUrl: string | null;
};

const statusBadge = (status: WorkStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "CLOSED_IN_HUBSPOT":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "LOST":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const priorityBadge = (priority: string) => {
  const p = priority.toUpperCase();
  if (p === "HIGH") return "bg-rose-50 text-rose-700 border border-rose-200";
  if (p === "MEDIUM") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const recentActivity = [
  "Martin marked Taylor Johnson as completed · 2h ago",
  "Lucia updated lead Sarah Jenkins · 4h ago",
  "Capitan added a note to Casey Johnson · 6h ago",
  "Miguel created a new lead for Sample Developer 02 · 1d ago",
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

export default function ExecutiveDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // TODO: replace hardcoded owner with real filter
        const res = await fetch("/api/leads?owner=Martin&workStatus=PENDING,IN_PROGRESS");
        const data = await res.json();
        setLeads(data.leads || []);
      } catch (e) {
        console.error("Failed to load dashboard", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleComplete = async (leadId: string) => {
    setProcessingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/work`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update");
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, workStatus: "IN_PROGRESS" } : l)),
      );
    } catch (err) {
      alert("Error updating lead. Please check console.");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = leads.filter((l) => l.workStatus === "PENDING").length;
  const highPriorityCount = leads.filter((l) => l.priority?.toUpperCase() === "HIGH").length;
  const inProgressCount = leads.filter((l) => l.workStatus === "IN_PROGRESS").length;
  const totalLeads = leads.length;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Poneglyph • Executive Overview
          </p>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">
            Snapshot of lead activity, ownership, and status at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/accounts"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Accounts
          </Link>
          <Link
            href="/sales"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Leads
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-10">
        <DashboardStats title="Pending Actions" value={pendingCount} trend="Awaiting follow-up" color="blue" />
        <DashboardStats title="In Progress" value={inProgressCount} trend="Being worked" color="amber" />
        <DashboardStats title="High Priority" value={highPriorityCount} trend="Must contact today" color="rose" />
        <DashboardStats title="Total Leads" value={totalLeads} trend="Current pipeline" color="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Action Required</h3>
              <p className="text-sm text-slate-500">Leads sorted by priority and last touch.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">LIVE DATA</span>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-400">Loading mission critical data...</div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No pending leads found. Good job!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Executive / Lead</th>
                    <th className="px-6 py-3 text-left">Company Target</th>
                    <th className="px-6 py-3 text-left">Priority</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
                            {initials(lead.fullName)}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{lead.fullName}</div>
                            <div className="text-xs text-slate-500">{lead.title || "No Title"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{lead.account.name}</div>
                        <div className="text-xs text-slate-500">{lead.account.market || "Global"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${priorityBadge(
                            lead.priority,
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge(
                            lead.workStatus,
                          )}`}
                        >
                          {lead.workStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {lead.hubspotContactUrl && (
                            <a
                              href={lead.hubspotContactUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-blue-600 text-xs font-medium transition"
                            >
                              View CRM
                            </a>
                          )}
                          <button
                            onClick={() => handleComplete(lead.id)}
                            disabled={!!processingId || lead.workStatus === "IN_PROGRESS"}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                              lead.workStatus === "IN_PROGRESS"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                                : "bg-slate-900 text-white hover:bg-blue-600"
                            }`}
                          >
                            {processingId === lead.id
                              ? "Syncing..."
                              : lead.workStatus === "IN_PROGRESS"
                              ? "Completed"
                              : "Mark Complete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-sm text-slate-500">Team updates at a glance</p>
            </div>
            <span className="text-xs font-mono text-slate-400">SIMULATED</span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
