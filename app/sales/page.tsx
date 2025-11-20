"use client";

import React, { useEffect, useMemo, useState } from "react";

type PlayerType = "ASSET_MANAGER" | "DEVELOPER" | "FAMILY_OFFICE" | "OTHER";

type LeadRouteType = "WARM" | "DIRECT_AFFINITY" | "COLD";
type LeadWorkStatus = "PENDING" | "IN_PROGRESS" | "CLOSED_IN_HUBSPOT" | "LOST";
type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

type Account = {
  id: string;
  name: string;
  website: string | null;
  market: string | null;
  country: string | null;
  playerType: PlayerType;
  residentialOperation: boolean | null;
  multifamilyExposure: boolean | null;
  affordableOnly: boolean | null;
  sunbeltFlag: boolean | null;
  aumBucket: string | null;
  fitScore: number | null;
  sourceList: string | null;
};

type Lead = {
  id: string;
  accountId: string;
  fullName: string;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
  routeType: LeadRouteType;
  leadOwner: string;
  priority: LeadPriority;
  workStatus: LeadWorkStatus;
  lastTouchDate: string | null;
  hubspotContactUrl: string | null;
  market: string | null;
  sourceList: string | null;
  internalNotes: string | null;
  account: Account;
};

type ApiResponse = {
  leads: Lead[];
};

// TODO: ajusta estos owners a los que realmente usas en tus seeds / produccion
const LEAD_OWNERS = ["Martin", "Capitan", "Lucia"];

const ROUTE_FILTERS: Array<LeadRouteType | "ALL"> = [
  "ALL",
  "WARM",
  "DIRECT_AFFINITY",
  "COLD",
];

const STATUS_FILTERS: Array<LeadWorkStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "IN_PROGRESS",
  "CLOSED_IN_HUBSPOT",
  "LOST",
];

const PLAYER_FILTERS: Array<PlayerType | "ALL"> = [
  "ALL",
  "ASSET_MANAGER",
  "DEVELOPER",
  "FAMILY_OFFICE",
  "OTHER",
];

const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const statusLabel: Record<LeadWorkStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  CLOSED_IN_HUBSPOT: "Closed in HubSpot",
  LOST: "Lost",
};

const routeLabel: Record<LeadRouteType, string> = {
  WARM: "Warm intro",
  DIRECT_AFFINITY: "Direct affinity",
  COLD: "Cold",
};

const playerLabel: Record<PlayerType, string> = {
  ASSET_MANAGER: "Asset Manager",
  DEVELOPER: "Developer",
  FAMILY_OFFICE: "Family Office",
  OTHER: "Other",
};

export default function SalesConsolePage() {
  const [owner, setOwner] = useState<string>(LEAD_OWNERS[0]);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] =
    useState<LeadRouteType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] =
    useState<LeadWorkStatus | "ALL">("PENDING");
  const [playerFilter, setPlayerFilter] =
    useState<PlayerType | "ALL">("ALL");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads whenever owner changes
  useEffect(() => {
    let cancelled = false;

    async function fetchLeads() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/leads?owner=${encodeURIComponent(owner)}`,
        );
        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }
        const data = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setLeads(data.leads ?? []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error(err);
          setError("Could not load leads. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLeads();

    return () => {
      cancelled = true;
    };
  }, [owner]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (routeFilter !== "ALL" && lead.routeType !== routeFilter)
          return false;
        if (statusFilter !== "ALL" && lead.workStatus !== statusFilter)
          return false;
        if (
          playerFilter !== "ALL" &&
          lead.account.playerType !== playerFilter
        )
          return false;
        if (!search.trim()) return true;

        const term = search.toLowerCase();
        return (
          lead.fullName.toLowerCase().includes(term) ||
          (lead.title ?? "").toLowerCase().includes(term) ||
          lead.account.name.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // 1) Priority HIGH > MEDIUM > LOW
        const rank: Record<LeadPriority, number> = {
          HIGH: 0,
          MEDIUM: 1,
          LOW: 2,
        };
        const prioDiff = rank[a.priority] - rank[b.priority];
        if (prioDiff !== 0) return prioDiff;

        // 2) Oldest / never-touched first
        const aTime = a.lastTouchDate
          ? new Date(a.lastTouchDate).getTime()
          : 0;
        const bTime = b.lastTouchDate
          ? new Date(b.lastTouchDate).getTime()
          : 0;
        return aTime - bTime;
      });
  }, [leads, routeFilter, statusFilter, playerFilter, search]);

  async function handleMarkWorked(leadId: string) {
    try {
      // Optimistic UI: mark local state first
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                workStatus:
                  lead.workStatus === "PENDING"
                    ? "IN_PROGRESS"
                    : lead.workStatus,
                lastTouchDate: new Date().toISOString(),
              }
            : lead,
        ),
      );

      const res = await fetch(`/api/leads/${leadId}/work`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      const updated = (await res.json()) as { lead: Lead };
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? updated.lead : lead,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Could not update lead. Please retry.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        {/* Sidebar simple */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h1 className="text-white font-bold text-lg tracking-tight">
              Poneglyph <span className="text-xs text-emerald-400">Sales Console</span>
            </h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-3 text-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
              Growth / SDR
            </div>
            <div className="px-2 py-2 rounded-lg bg-slate-900 text-slate-50 font-medium">
              My Leads
            </div>
          </nav>
          <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
            Andes STR - Internal Tool
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-slate-900/60">
          <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-50">
                  My Leads
                </h2>
                <p className="text-sm text-slate-400">
                  Focused queue of accounts & contacts to work today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">Lead owner</div>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {LEAD_OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </header>

            {/* Filters */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Route
                </span>
                <div className="flex gap-1">
                  {ROUTE_FILTERS.map((rt) => (
                    <button
                      key={rt}
                      onClick={() => setRouteFilter(rt)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        routeFilter === rt
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {rt === "ALL" ? "All" : routeLabel[rt]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Status
                </span>
                <div className="flex gap-1">
                  {STATUS_FILTERS.map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        statusFilter === st
                          ? "bg-sky-500 text-slate-900 border-sky-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {st === "ALL" ? "All" : statusLabel[st]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Player
                </span>
                <div className="flex gap-1">
                  {PLAYER_FILTERS.map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setPlayerFilter(pt)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        playerFilter === pt
                          ? "bg-indigo-500 text-slate-900 border-indigo-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {pt === "ALL" ? "All" : playerLabel[pt]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search account, lead, title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </section>

            {/* Table */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Leads ({filteredLeads.length})
                </span>
                {loading && (
                  <span className="text-xs text-slate-400">
                    Loading...
                  </span>
                )}
              </div>

              {error && (
                <div className="px-4 py-2 text-xs text-red-400 border-b border-red-500/40 bg-red-950/40">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-slate-200">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Account</th>
                      <th className="px-4 py-2 text-left">Player</th>
                      <th className="px-4 py-2 text-left">Lead</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Market</th>
                      <th className="px-4 py-2 text-left">Fit</th>
                      <th className="px-4 py-2 text-left">Route</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Last touch</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 && !loading ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No leads match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-slate-850/50 hover:bg-slate-900/80 transition-colors"
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-100">
                              {lead.account.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {lead.account.website ?? ""}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-200 border border-slate-700">
                              {playerLabel[lead.account.playerType]}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-100">
                              {lead.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Owner: {lead.leadOwner}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-[12px] text-slate-200">
                              {lead.title ?? "-"}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-[12px] text-slate-200">
                              {lead.market ?? lead.account.market ?? "-"}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold">
                              {lead.account.fitScore ?? "-"}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/40 text-[11px]">
                              {routeLabel[lead.routeType]}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${
                                lead.workStatus === "PENDING"
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                                  : lead.workStatus === "IN_PROGRESS"
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                                  : lead.workStatus === "CLOSED_IN_HUBSPOT"
                                    ? "bg-slate-500/10 text-slate-200 border-slate-500/40"
                                    : "bg-red-500/10 text-red-300 border-red-500/40"
                              }`}
                            >
                              {statusLabel[lead.workStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[12px] text-slate-300">
                            {formatDate(lead.lastTouchDate)}
                          </td>
                          <td className="px-4 py-2 text-right space-x-2">
                            {lead.hubspotContactUrl && (
                              <a
                                href={lead.hubspotContactUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-slate-700 text-slate-100 hover:border-emerald-400 hover:text-emerald-300"
                              >
                                {"HubSpot ->"}
                              </a>
                            )}
                            <button
                              onClick={() => handleMarkWorked(lead.id)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                            >
                              Mark worked
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
