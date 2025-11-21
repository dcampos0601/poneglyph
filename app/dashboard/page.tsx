'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardStats } from '../../components/DashboardStats';

// --- Types (Reuse from your existing types or Prisma) ---
// In a real app, import these from a shared types file
type WorkStatus = 'PENDING' | 'IN_PROGRESS' | 'CLOSED_IN_HUBSPOT' | 'LOST';
type Lead = {
  id: string;
  fullName: string;
  title: string | null;
  account: { name: string; market: string | null };
  workStatus: WorkStatus;
  priority: string;
  hubspotContactUrl: string | null;
};

export default function BossDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- Fetch Data ---
  useEffect(() => {
    async function loadData() {
      try {
        // TODO: When Auth is ready, remove hardcoded 'Martin'
        const res = await fetch('/api/leads?owner=Martin&workStatus=PENDING,IN_PROGRESS');
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

  // --- Action Handler ---
  const handleComplete = async (leadId: string) => {
    setProcessingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/work`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update');
      
      // Optimistic Update: Update UI immediately
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, workStatus: 'IN_PROGRESS' } : l
      ));
      
    } catch (err) {
      alert("Error updating lead. Please check console.");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // --- Derived Metrics ---
  const pendingCount = leads.filter(l => l.workStatus === 'PENDING').length;
  const highPriorityCount = leads.filter(l => l.priority === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-slate-500">Priority Queue • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sales"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Executive Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Sales Console
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
        <DashboardStats 
          title="Pending Actions" 
          value={pendingCount} 
          trend="Leads waiting" 
          color="blue" 
        />
        <DashboardStats 
          title="High Priority" 
          value={highPriorityCount} 
          trend="Must contact today" 
          color="rose" 
        />
        <DashboardStats 
          title="System Status" 
          value="Online" 
          trend="HubSpot Sync Pending" 
          color="slate" 
        />
      </div>

      {/* Main Action Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Action Required</h3>
          <span className="text-xs font-mono text-slate-400">LIVE DATA</span>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading mission critical data...</div>
        ) : leads.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No pending leads found. Good job!</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Executive / Lead</th>
                <th className="px-6 py-3">Company Target</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{lead.fullName}</div>
                    <div className="text-slate-500 text-xs">{lead.title || 'No Title'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{lead.account.name}</div>
                    <div className="text-slate-500 text-xs">{lead.account.market || 'Global'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.priority === 'HIGH' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse"/> High Priority
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {lead.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                    {lead.hubspotContactUrl && (
                        <a 
                          href={lead.hubspotContactUrl} 
                          target="_blank" 
                          className="text-slate-400 hover:text-blue-600 text-xs font-medium transition"
                        >
                          View CRM
                        </a>
                    )}
                    <button
                      onClick={() => handleComplete(lead.id)}
                      disabled={!!processingId || lead.workStatus === 'IN_PROGRESS'}
                      className={`
                        relative overflow-hidden rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wide transition-all
                        ${lead.workStatus === 'IN_PROGRESS' 
                          ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                          : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'}
                      `}
                    >
                      {processingId === lead.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Syncing...
                        </span>
                      ) : lead.workStatus === 'IN_PROGRESS' ? (
                        "✓ Completed"
                      ) : (
                        "Mark Complete"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
