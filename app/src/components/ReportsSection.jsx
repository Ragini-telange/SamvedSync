import { useState, useEffect } from 'react';
import { loadPatients, loadAlerts } from '../lib/dashboardData';
import { Download, FileText, Printer, Search, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsSection() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [p, a] = await Promise.all([loadPatients(), loadAlerts()]);
      setPatients(p);
      setAlerts(a);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDownloadCSV = () => {
    if (!patients.length) return;
    const headers = ['Patient Name', 'Age', 'Bed', 'Ward', 'Assigned Nurse', 'Drop Factor', 'Prescribed Rate (mL/hr)', 'ThingSpeak Channel', 'Status'];
    const rows = patients.map(p => [
      `"${p.name}"`,
      p.age || '',
      `"${p.bed_number}"`,
      `"${p.ward || ''}"`,
      `"${p.nurses?.profiles?.name || 'Unassigned'}"`,
      p.drop_factor || '',
      p.prescribed_rate_ml_hr || '',
      p.thingspeak_channel_id || '',
      p.is_active ? 'ACTIVE' : 'INACTIVE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SamvedSync_Patient_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.ward && p.ward.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter === 'active') return matchesSearch && p.is_active;
    if (statusFilter === 'inactive') return matchesSearch && !p.is_active;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Search & Export Buttons Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-saline" />
            Export Hospital Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download or print telemetry summary reports for clinical auditing.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient, bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saline/20"
            />
          </div>
        </div>
      </div>

      {/* Action Cards for CSV & PDF Export */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-ink dark:text-white text-lg mb-1">Export CSV Data</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Download current patient telemetric readings & assignment logs in standard CSV spreadsheet format.
          </p>
          <button
            onClick={handleDownloadCSV}
            className="bg-saline hover:bg-saline-dim text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-saline/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download CSV Spreadsheet
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Printer className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-ink dark:text-white text-lg mb-1">Export Printable PDF Report</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Generate a formatted printable report for shift handover and hospital administration.
          </p>
          <button
            onClick={handlePrintPDF}
            className="bg-ink dark:bg-slate-800 hover:bg-ink-surface text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-ink/20 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / Generate PDF Report
          </button>
        </div>
      </div>

      {/* Export Preview Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="font-semibold text-ink dark:text-white text-md">
            Export Preview ({filteredPatients.length} Patients Selected)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${statusFilter === 'all' ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${statusFilter === 'active' ? 'bg-saline text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Active Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Bed / Ward</th>
                <th className="px-6 py-4">Assigned Nurse</th>
                <th className="px-6 py-4">Fluid Level</th>
                <th className="px-6 py-4">Drip Rate</th>
                <th className="px-6 py-4">Flow Status</th>
                <th className="px-6 py-4 text-center">Telemetry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading preview data...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No matching patients found.</td></tr>
              ) : (
                filteredPatients.map((p) => {
                  const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
                    ? `${((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)} dpm`
                    : '0 dpm';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink dark:text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">Age {p.age || '—'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {p.bed_number} <span className="text-slate-400 font-normal text-xs ml-1">· {p.ward || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-saline/10 text-saline">
                          {p.nurses?.profiles?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                        {p.is_active ? '78% Normal' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                        {p.is_active ? targetRate : '0 dpm'}
                      </td>
                      <td className="px-6 py-4">
                        {p.is_active ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Forward
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Stopped</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Activity className="w-3.5 h-3.5" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            INACTIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
