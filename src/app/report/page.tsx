'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft, 
  RefreshCw, Download, Clock, Building2, FileText
} from 'lucide-react';
import { SyncResult, DashboardMetrics } from '@/lib/types';

export default function SyncReport() {
  const [results, setResults] = useState<SyncResult[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      setResults(data.results || []);
      setMetrics(data.metrics || null);
    } catch (e) {
      console.error('Failed to fetch sync data:', e);
    }
    setLoading(false);
  }

  const filteredResults = results.filter(r => filter === 'all' || r.status === filter);

  const statusCounts = {
    all: results.length,
    success: results.filter(r => r.status === 'success').length,
    warning: results.filter(r => r.status === 'warning').length,
    error: results.filter(r => r.status === 'error').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Sync Report</h1>
              <p className="text-sm text-slate-500">Review RPA sync status and errors</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total Syncs" value={statusCounts.all} icon={<FileText className="w-5 h-5" />} color="blue" />
            <SummaryCard label="Successful" value={statusCounts.success} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
            <SummaryCard label="Warnings" value={statusCounts.warning} icon={<AlertTriangle className="w-5 h-5" />} color="yellow" />
            <SummaryCard label="Errors" value={statusCounts.error} icon={<XCircle className="w-5 h-5" />} color="red" />
          </div>
        )}

        <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 flex">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={statusCounts.all} />
          <FilterTab active={filter === 'success'} onClick={() => setFilter('success')} label="Success" count={statusCounts.success} color="green" />
          <FilterTab active={filter === 'warning'} onClick={() => setFilter('warning')} label="Warnings" count={statusCounts.warning} color="yellow" />
          <FilterTab active={filter === 'error'} onClick={() => setFilter('error')} label="Errors" count={statusCounts.error} color="red" />
        </div>

        <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              Loading sync data...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
              No sync records found
              <p className="text-sm mt-2">Run an RPA workflow from the dashboard to see results here.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Patient</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">EMR</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Fields</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => (
                  <ResultRow key={result.id} result={result} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'blue' | 'green' | 'yellow' | 'red' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600 border-blue-200', green: 'bg-green-50 text-green-600 border-green-200', yellow: 'bg-amber-50 text-amber-600 border-amber-200', red: 'bg-red-50 text-red-600 border-red-200' };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-medium">{label}</span></div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function FilterTab({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: 'green' | 'yellow' | 'red' }) {
  const dotColors = { green: 'bg-green-500', yellow: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <button onClick={onClick} className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${active ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
      {color && <span className={`w-2 h-2 rounded-full ${dotColors[color]}`} />}
      {label}
      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  );
}

function ResultRow({ result }: { result: SyncResult }) {
  const [expanded, setExpanded] = useState(false);
  const statusIcons = { success: <CheckCircle2 className="w-5 h-5 text-green-600" />, warning: <AlertTriangle className="w-5 h-5 text-amber-500" />, error: <XCircle className="w-5 h-5 text-red-500" /> };
  const statusBg = { success: 'bg-green-50', warning: 'bg-amber-50', error: 'bg-red-50' };
  return (
    <>
      <tr className={`hover:bg-slate-50 ${statusBg[result.status]}`}>
        <td className="px-6 py-4">{statusIcons[result.status]}</td>
        <td className="px-6 py-4"><p className="font-medium text-slate-900">{result.patientName}</p></td>
        <td className="px-6 py-4"><span className="inline-flex items-center gap-1 text-sm"><Building2 className="w-4 h-4 text-slate-400" />{result.emrType}</span></td>
        <td className="px-6 py-4"><span className="text-sm">{result.fieldsPopulated}/{result.totalFields} fields</span></td>
        <td className="px-6 py-4"><span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(result.timestamp).toLocaleTimeString()}</span></td>
        <td className="px-6 py-4"><button onClick={() => setExpanded(!expanded)} className="text-sm text-blue-600 hover:text-blue-700">{expanded ? 'Hide' : 'View'}</button></td>
      </tr>
      {expanded && (
        <tr className={statusBg[result.status]}>
          <td colSpan={6} className="px-6 py-4 border-t border-slate-200">
            <div className="text-sm space-y-2">
              <p className="text-slate-700">{result.message}</p>
              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-amber-100 rounded-lg p-3">
                  <p className="font-semibold text-amber-800 mb-1">Warnings:</p>
                  <ul className="list-disc list-inside text-amber-700">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
