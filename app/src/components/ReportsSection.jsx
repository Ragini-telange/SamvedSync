import { useState, useEffect } from 'react';
import { loadPatients, loadAlerts } from '../lib/dashboardData';
import { Download, FileText, Printer, Search, Activity, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
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

  const handleDownloadPatientsCSV = () => {
    if (!patients.length) return;
    const headers = [
      'Patient Name', 'Age', 'Gender', 'Bed Number', 'Ward', 
      'Assigned Doctor', 'Assigned Nurse', 'Drop Factor (gtt/mL)', 
      'Prescribed Rate (mL/hr)', 'Target Drip Rate (gtt/min)', 
      'ThingSpeak Channel ID', 'Telemetry Status'
    ];
    const rows = patients.map(p => {
      const targetGttMin = p.drop_factor && p.prescribed_rate_ml_hr 
        ? Math.round((p.prescribed_rate_ml_hr * p.drop_factor) / 60) 
        : '';
      return [
        `"${p.name}"`,
        p.age || '',
        `"${p.gender || ''}"`,
        `"${p.bed_number}"`,
        `"${p.ward || ''}"`,
        `"${p.doctors?.profiles?.name || 'Unassigned'}"`,
        `"${p.nurses?.profiles?.name || 'Unassigned'}"`,
        p.drop_factor || '',
        p.prescribed_rate_ml_hr || '',
        targetGttMin,
        p.thingspeak_channel_id || '',
        p.is_active ? 'ACTIVE' : 'INACTIVE'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SamvedSync_Patient_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAlertsCSV = () => {
    if (!alerts.length) return;
    const headers = ['Timestamp', 'Patient Name', 'Bed Number', 'Alert Type', 'Severity', 'Message', 'Status'];
    const rows = alerts.map(a => [
      `"${new Date(a.created_at).toISOString()}"`,
      `"${a.patients?.name || 'Unknown'}"`,
      `"${a.patients?.bed_number || '—'}"`,
      `"${a.alert_type || 'ALERT'}"`,
      `"${a.severity || 'warning'}"`,
      `"${(a.message || '').replace(/"/g, '""')}"`,
      a.acknowledged ? 'RESOLVED' : 'UNRESOLVED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SamvedSync_Hospital_Alerts_Log_${new Date().toISOString().slice(0, 10)}.csv`);
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
    <div className="space-y-8 font-body">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-saline" />
            Hospital Telemetry & Audit Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export patient records, clinical assignments, and system safety alerts for administrative auditing.
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

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <Download className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-ink dark:text-white text-base mb-1">Patient Registry CSV</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
            Export all patients, beds, clinical prescriptions, and IoT device channels in CSV format.
          </p>
          <button
            onClick={handleDownloadPatientsCSV}
            className="w-full bg-saline hover:bg-saline-dim text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md shadow-saline/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Patients CSV
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-ink dark:text-white text-base mb-1">Alerts Audit Log CSV</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
            Export historical safety alert incidents, backflow detections, and acknowledgement logs.
          </p>
          <button
            onClick={handleDownloadAlertsCSV}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Alerts CSV
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Printer className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-ink dark:text-white text-base mb-1">Printable Summary</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
            Generate a formatted printable PDF summary for clinical handovers and administrative records.
          </p>
          <button
            onClick={handlePrintPDF}
            className="w-full bg-ink dark:bg-slate-800 hover:bg-ink-surface text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-md shadow-ink/20 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / PDF Report
          </button>
        </div>
      </div>

      {/* Export Preview Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="font-semibold text-ink dark:text-white text-sm">
            Registry Preview ({filteredPatients.length} Patients)
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
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Assigned Nurse</th>
                <th className="px-6 py-4">Prescribed Target</th>
                <th className="px-6 py-4">IoT Hardware</th>
                <th className="px-6 py-4 text-center">Status</th>
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
                    ? `${Math.round((p.prescribed_rate_ml_hr * p.drop_factor) / 60)} gtt/min`
                    : '—';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink dark:text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">Age {p.age || '—'} · {p.gender || '—'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {p.bed_number} <span className="text-slate-400 font-normal text-xs ml-1">· {p.ward || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                          {p.doctors?.profiles?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-saline/10 text-saline">
                          {p.nurses?.profiles?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {targetRate} <span className="text-slate-400">({p.prescribed_rate_ml_hr || '—'} mL/hr)</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {p.thingspeak_channel_id ? `CH: ${p.thingspeak_channel_id}` : 'Manual'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Activity className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
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
