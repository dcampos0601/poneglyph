'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type RouteType = 'WARM' | 'DIRECT_AFFINITY' | 'COLD';
type WorkStatus = 'PENDING' | 'IN_PROGRESS' | 'CLOSED_IN_HUBSPOT' | 'LOST';
type PlayerType =
  | 'ASSET_MANAGER'
  | 'PROPERTY_MANAGEMENT'
  | 'DEVELOPER'
  | 'FAMILY_OFFICE'
  | 'OTHER';

type Lead = {
  id: string;
  accountId: string;
  fullName: string;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
  routeType: RouteType;
  leadOwner: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  workStatus: WorkStatus;
  lastTouchDate: string | null;
  hubspotContactUrl: string | null;
  market: string | null;
  fitScore: number | null;
  sourceList: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;

  account: {
    name: string;
    website: string | null;
    market: string | null;
    country: string | null;
    playerType: PlayerType;
    aumBucket: string | null;
    sunbeltFlag: boolean | null;
  };
};

type GetLeadsResponse = {
  leads: Lead[];
};

const OWNERS = ['All', 'Martin', 'Capitan', 'Lucia', 'Miguel', 'Other'];

const PLAYER_FILTERS: Array<{ value: PlayerType | 'ALL'; label: string }> = [
  { value: 'ASSET_MANAGER', label: 'Asset Manager' },
  { value: 'PROPERTY_MANAGEMENT', label: 'Property Management' },
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'FAMILY_OFFICE', label: 'Family Office' },
  { value: 'OTHER', label: 'Other' },
  { value: 'ALL', label: 'All Players' },
];


const routeLabel: Record<RouteType, string> = {
  WARM: 'Warm intro',
  DIRECT_AFFINITY: 'Affinity',
  COLD: 'Cold',
};

const statusLabel: Record<WorkStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  CLOSED_IN_HUBSPOT: 'Closed in HubSpot',
  LOST: 'Lost',
};

const playerTypeLabel: Record<PlayerType, string> = {
  ASSET_MANAGER: 'Asset Manager',
  PROPERTY_MANAGEMENT: 'Property Mgmt',
  DEVELOPER: 'Developer',
  FAMILY_OFFICE: 'Family Office',
  OTHER: 'Other',
};

  const playerTypeClasses: Record<PlayerType, string> = {
  ASSET_MANAGER: 'bg-slate-100 text-slate-700 border border-slate-200',
  PROPERTY_MANAGEMENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  DEVELOPER: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  FAMILY_OFFICE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  OTHER: 'bg-slate-50 text-slate-700 border border-slate-200',
};

const statusClasses = (status: WorkStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'CLOSED_IN_HUBSPOT':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'LOST':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return '';
  }
};

const routeClasses = (route: RouteType) => {
  switch (route) {
    case 'WARM':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'DIRECT_AFFINITY':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'COLD':
      return 'bg-slate-50 text-slate-700 border border-slate-200';
    default:
      return '';
  }
};

export default function SalesConsolePage() {
  const [owner, setOwner] = useState<string>('All');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerFilter, setPlayerFilter] = useState<PlayerType | 'ALL'>('ALL');

  const filteredLeads = leads.filter((lead) =>
    playerFilter === 'ALL' ? true : lead.account.playerType === playerFilter,
  );

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (owner !== 'All') {
          params.set('owner', owner);
        }

        const res = await fetch(`/api/leads?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Error al cargar leads (${res.status})`);
        }

        const data: GetLeadsResponse = await res.json();
        setLeads(data.leads ?? []);
      } catch (err: unknown) {
        console.error('Error fetching leads', err);
        setError(err instanceof Error ? err.message : 'Error al cargar leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [owner]);

  const handleMarkWorked = async (leadId: string) => {
    try {
      setWorkingId(leadId);
      setError(null);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                workStatus: 'IN_PROGRESS',
                lastTouchDate: new Date().toISOString(),
              }
            : l,
        ),
      );

      const res = await fetch(`/api/leads/${leadId}/work`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Error al marcar lead (${res.status})`);
      }

      const data = await res.json();
      const updated = data.lead as Lead;

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l)),
      );
    } catch (err: unknown) {
      console.error('Error marking lead as worked', err);
      setError(err instanceof Error ? err.message : 'Error al marcar lead como trabajado');
    } finally {
      setWorkingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const openInHubSpot = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-8 px-6 py-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Poneglyph â€¢ SDR Workspace
              </p>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Leads
              </h1>
              <p className="text-sm text-slate-500">
                Today's prioritized queue for institutional leads.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                href="/import/leads"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Upload Leads
              </Link>
              <Link
                href="/accounts"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Accounts
              </Link>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Current user
                </label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filters
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Player Type</span>
              <select
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value as PlayerType | 'ALL')}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PLAYER_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                My Leads
              </span>
              {loading ? (
                <span className="text-xs text-slate-500">Loading...</span>
              ) : (
                <span className="text-xs text-slate-500">
                  {leads.length} lead(s) for {owner}
                </span>
              )}
            </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Account</th>
                  <th className="px-4 py-2 text-left">Player</th>
                    <th className="px-4 py-2 text-left">Lead</th>
                    <th className="px-4 py-2 text-left">Market</th>
                    <th className="px-4 py-2 text-left">Route</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Fit</th>
                    <th className="px-4 py-2 text-left">Last touch</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No leads found for this owner.
                      </td>
                    </tr>
                  )}

                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">
                          {lead.account.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lead.account.market ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${playerTypeClasses[lead.account.playerType]}`}
                        >
                          {playerTypeLabel[lead.account.playerType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">
                          {lead.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lead.title ?? '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Owner: {lead.leadOwner || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs text-slate-600">
                          {lead.market ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${routeClasses(lead.routeType)}`}
                        >
                          {routeLabel[lead.routeType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(lead.workStatus)}`}
                        >
                          {statusLabel[lead.workStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex h-7 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {lead.fitScore ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600">
                        {formatDate(lead.lastTouchDate)}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openInHubSpot(lead.hubspotContactUrl)}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700"
                          >
                            Open in HubSpot
                          </button>
                          <button
                            type="button"
                            disabled={workingId === lead.id}
                            onClick={() => handleMarkWorked(lead.id)}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {workingId === lead.id ? 'Updating...' : 'Mark worked'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



