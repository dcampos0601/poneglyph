"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Lead, RouteType, FitScoreLevel, WorkStatus } from "@/lib/sheets";
import {
  getLeadsForOwner,
  markLeadWorkedToday,
  MOCK_LEAD_OWNERS,
  MOCK_MARKETS,
  type LeadFilters,
} from "@/lib/sheets";

const ownerOptions = MOCK_LEAD_OWNERS.length ? ["All", ...MOCK_LEAD_OWNERS] : ["All", "Martin"];
const routeTypeOptions: Array<"All" | RouteType> = ["All", "Warm", "Direct Affinity", "Cold"];
const fitScoreOptions: Array<"All" | FitScoreLevel> = ["All", "High", "Medium", "Low"];
const workStatusOptions: Array<"All" | WorkStatus> = [
  "All",
  "Pending",
  "In Progress",
  "Closed in HubSpot",
  "Lost",
];
const marketOptions = ["All", ...MOCK_MARKETS];

const fitBadgeStyles: Record<FitScoreLevel, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-rose-100 text-rose-700",
};

const routeBadgeStyles: Record<RouteType, string> = {
  Warm: "bg-orange-50 text-orange-700 border-orange-200",
  "Direct Affinity": "bg-blue-50 text-blue-700 border-blue-200",
  Cold: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusBadgeStyles: Record<WorkStatus, string> = {
  Pending: "bg-slate-100 text-slate-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  "Closed in HubSpot": "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>;
}

export default function AccountsPage() {
  const [currentOwner, setCurrentOwner] = useState(ownerOptions[0]);
  const [routeTypeFilter, setRouteTypeFilter] = useState<(typeof routeTypeOptions)[number]>("All");
  const [fitScoreFilter, setFitScoreFilter] = useState<(typeof fitScoreOptions)[number]>("All");
  const [workStatusFilter, setWorkStatusFilter] = useState<(typeof workStatusOptions)[number]>("All");
  const [marketFilter, setMarketFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [workingLeadId, setWorkingLeadId] = useState<string | null>(null);

  const activeFilters = useMemo<LeadFilters>(
    () => ({
      routeType: routeTypeFilter === "All" ? undefined : (routeTypeFilter as RouteType),
      fitScore: fitScoreFilter === "All" ? undefined : (fitScoreFilter as FitScoreLevel),
      workStatus: workStatusFilter === "All" ? undefined : (workStatusFilter as WorkStatus),
      market: marketFilter === "All" ? undefined : marketFilter,
      search: searchTerm.trim() || undefined,
    }),
    [routeTypeFilter, fitScoreFilter, workStatusFilter, marketFilter, searchTerm],
  );

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    getLeadsForOwner(currentOwner === "All" ? undefined : currentOwner, activeFilters)
      .then((data) => {
        if (!isActive) return;
        setLeads(data);
      })
      .catch(() => {
        if (!isActive) return;
        setError("Unable to load leads right now. Please try again shortly.");
        setLeads([]);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [currentOwner, activeFilters]);

  useEffect(() => {
    if (!selectedLead) return;
    const stillExists = leads.some((lead) => lead.leadId === selectedLead.leadId);
    if (!stillExists) setSelectedLead(null);
  }, [leads, selectedLead]);

  const detailLead = useMemo(
    () => (selectedLead ? leads.find((lead) => lead.leadId === selectedLead.leadId) || selectedLead : null),
    [leads, selectedLead],
  );

  const handleMarkWorked = async (leadId: string) => {
    setWorkingLeadId(leadId);
    try {
      const updated = await markLeadWorkedToday(leadId);
      if (!updated) return;
      setLeads((prev) => prev.map((lead) => (lead.leadId === leadId ? updated : lead)));
      setSelectedLead((prev) => (prev && prev.leadId === leadId ? updated : prev));
    } finally {
      setWorkingLeadId(null);
    }
  };

  const tableStateMessage = useMemo(() => {
    if (isLoading) return "Loading leads...";
    if (error) return error;
    if (!leads.length) return "No leads match the selected filters.";
    return null;
  }, [isLoading, error, leads.length]);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <main className="flex-1 px-8 py-10">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-6 py-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-900">
                Poneglyph • SDR Workspace
              </p>
              <h1 className="text-3xl font-bold text-slate-950 leading-tight">My Leads</h1>
              <p className="text-sm text-slate-500">Today&apos;s prioritized queue for institutional leads.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                href="/sales"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Leads
              </Link>
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-slate-200">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Current User
                </label>
                <select
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                  value={currentOwner}
                  onChange={(event) => setCurrentOwner(event.target.value)}
                >
                  {ownerOptions.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <SectionLabel label="Route Type" />
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={routeTypeFilter}
                onChange={(event) => setRouteTypeFilter(event.target.value as any)}
              >
                {routeTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <SectionLabel label="Fit Score" />
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={fitScoreFilter}
                onChange={(event) => setFitScoreFilter(event.target.value as any)}
              >
                {fitScoreOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <SectionLabel label="Work Status" />
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={workStatusFilter}
                onChange={(event) => setWorkStatusFilter(event.target.value as any)}
              >
                {workStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <SectionLabel label="Market" />
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={marketFilter}
                onChange={(event) => setMarketFilter(event.target.value)}
              >
                {marketOptions.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 lg:col-span-1">
              <SectionLabel label="Search" />
              <input
                type="text"
                placeholder="Account, lead, title..."
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Leads for {currentOwner === "All" ? "All owners" : currentOwner}
              </h2>
              <p className="text-sm text-slate-500">Sorted by priority and last touch.</p>
            </div>
            <span className="text-sm font-medium text-slate-500">{leads.length} results</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Market</th>
                  <th className="px-6 py-3">Fit</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Touch</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const isActive = detailLead?.leadId === lead.leadId;
                  return (
                    <tr
                      key={lead.leadId}
                      className={`cursor-pointer transition hover:bg-slate-50 ${isActive ? "bg-blue-50/50" : ""}`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{lead.accountName}</p>
                        <p className="text-xs text-slate-500">{lead.priority} priority</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{lead.leadName}</p>
                        <p className="text-xs text-slate-500">{lead.title}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{lead.market}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${fitBadgeStyles[lead.fitScore]}`}
                        >
                          {lead.fitScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${routeBadgeStyles[lead.routeType]}`}
                        >
                          {lead.routeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[lead.workStatus]}`}
                        >
                          {lead.workStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(lead.lastTouchDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-sm">
                          <a
                            className="text-blue-600 hover:text-blue-700"
                            href={lead.hubspotContactUrl}
                            onClick={(event) => event.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in HubSpot
                          </a>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMarkWorked(lead.leadId);
                            }}
                            disabled={workingLeadId === lead.leadId}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {workingLeadId === lead.leadId ? "Updating..." : "Mark worked"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tableStateMessage && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">{tableStateMessage}</div>
            )}
          </div>
        </section>
      </main>

      <aside className="w-full border-l border-slate-200 bg-white p-6 shadow-inner md:w-96">
        {detailLead ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Lead Detail</p>
                <h2 className="text-xl font-semibold text-slate-900">{detailLead.leadName}</h2>
                <p className="text-sm text-slate-500">{detailLead.title}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm text-slate-700">
              <div>
                <SectionLabel label="Contact" />
                <div className="mt-2 space-y-1 text-slate-600">
                  <p>{detailLead.email}</p>
                  {detailLead.linkedInUrl && (
                    <a
                      href={detailLead.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <SectionLabel label="Route" />
                  <p className="font-medium text-slate-900">{detailLead.routeType}</p>
                </div>
                <div>
                  <SectionLabel label="Owner" />
                  <p className="font-medium text-slate-900">{detailLead.leadOwner}</p>
                </div>
                <div>
                  <SectionLabel label="Priority" />
                  <p className="font-medium text-slate-900">{detailLead.priority}</p>
                </div>
                <div>
                  <SectionLabel label="Status" />
                  <p className="font-medium text-slate-900">{detailLead.workStatus}</p>
                </div>
                <div>
                  <SectionLabel label="Last Touch" />
                  <p className="font-medium text-slate-900">{formatDate(detailLead.lastTouchDate)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <SectionLabel label="Account Snapshot" />
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{detailLead.accountName}</p>
                  <p className="text-xs text-slate-500">{detailLead.market}</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    <li>AUM Bucket: {detailLead.aumBucket}</li>
                    <li>Domain: {detailLead.domain}</li>
                    <li>Country: {detailLead.country}</li>
                    <li>
                      Flags: {detailLead.residentialExposure ? "Residential" : "-"},{" "}
                      {detailLead.multifamilyExposure ? "Multifamily" : "-"},{" "}
                      {detailLead.sunbeltFlag ? "Sunbelt" : "No Sunbelt"}
                    </li>
                    <li>Source List: {detailLead.sourceList}</li>
                  </ul>
                </div>
              </div>

              {detailLead.notesInternal && (
                <div>
                  <SectionLabel label="Internal Notes" />
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">{detailLead.notesInternal}</p>
                </div>
              )}

              {detailLead.evidenceUrl && (
                <div>
                  <SectionLabel label="Evidence / Doc" />
                  <a
                    href={detailLead.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Open reference
                  </a>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4">
              <a
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                href={detailLead.hubspotContactUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in HubSpot
              </a>
              <button
                type="button"
                onClick={() => handleMarkWorked(detailLead.leadId)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                disabled={workingLeadId === detailLead.leadId}
              >
                {workingLeadId === detailLead.leadId ? "Updating..." : "Mark as worked today"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-400">
            <p>Select a lead to view full context.</p>
            <p className="text-xs">HubSpot + Sheets snapshots surface here.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
