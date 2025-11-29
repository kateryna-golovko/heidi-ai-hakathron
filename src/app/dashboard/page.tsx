'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, Users, Zap, CheckCircle2, AlertTriangle, 
  Play, RefreshCw, ExternalLink, FileText, Activity,
  ChevronRight, Bot, Stethoscope, Building2, X,
  Mic, Calendar, Pill, AlertCircle, ClipboardList,
  ArrowRight, Eye, Upload
} from 'lucide-react';
import { MOCK_PATIENTS, Patient, HeidiNote, NormalizedNote, SyncResult, DashboardMetrics, PreChartDetails } from '@/lib/types';

type WorkflowStep = 'idle' | 'fetching' | 'normalizing' | 'syncing-meddirector' | 'syncing-bestpractice' | 'complete';

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [heidiNote, setHeidiNote] = useState<HeidiNote | null>(null);
  const [normalizedNote, setNormalizedNote] = useState<NormalizedNote | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
  const [showPreChart, setShowPreChart] = useState(false);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    patientsToday: 3,
    patientsCompleted: 0,
    timeSavedMinutes: 0,
    stepsEliminated: 0,
    successRate: 100,
    emrsSynced: 0,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      if (data.results) setSyncResults(data.results);
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  }

  // Simulate starting a Heidi session
  function startHeidiSession(patient: Patient) {
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, status: 'in-heidi' } : p
    ));
    setSelectedPatient({ ...patient, status: 'in-heidi' });
    // In real app, this would open Heidi in new tab
    window.open(patient.heidiSessionUrl || 'https://app.heidihealth.com', '_blank');
  }

  // Simulate completing Heidi session and approving note
  function markSessionComplete(patient: Patient) {
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, status: 'ready-for-sync' } : p
    ));
    setSelectedPatient({ ...patient, status: 'ready-for-sync' });
  }

  // Fetch note from Heidi and show preview before syncing
  async function fetchAndPreviewNote(patient: Patient) {
    setWorkflowStep('fetching');
    try {
      const heidiRes = await fetch(`/api/heidi?sessionId=${patient.heidiSessionId}`);
      const heidiData = await heidiRes.json();
      
      if (!heidiData.success) throw new Error(heidiData.error);
      setHeidiNote(heidiData.data);
      
      // Normalize
      setWorkflowStep('normalizing');
      await new Promise(r => setTimeout(r, 500));
      
      const normalizeRes = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heidiNote: heidiData.data,
          patientInfo: { dob: patient.dob, mrn: patient.mrn }
        })
      });
      const normalizeData = await normalizeRes.json();
      
      if (!normalizeData.success) throw new Error(normalizeData.error);
      setNormalizedNote(normalizeData.data);
      setWorkflowStep('idle');
      setShowNotePreview(true);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setWorkflowStep('idle');
    }
  }

  // Run the actual RPA sync to EMRs
  async function runRPASync(patient: Patient) {
    if (!normalizedNote) return;
    
    setShowNotePreview(false);
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, status: 'syncing' } : p
    ));
    
    // Sync to MedDirector
    setWorkflowStep('syncing-meddirector');
    await new Promise(r => setTimeout(r, 1500));
    
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: patient.heidiSessionId,
        emrType: 'MedDirector',
        normalizedNote
      })
    });
    
    // Sync to BestPractice
    setWorkflowStep('syncing-bestpractice');
    await new Promise(r => setTimeout(r, 1500));
    
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: patient.heidiSessionId,
        emrType: 'BestPractice',
        normalizedNote
      })
    });
    
    setWorkflowStep('complete');
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, status: 'synced' } : p
    ));
    setSelectedPatient({ ...patient, status: 'synced' });
    await fetchMetrics();
  }

  function resetDemo() {
    setPatients(MOCK_PATIENTS);
    setSelectedPatient(null);
    setHeidiNote(null);
    setNormalizedNote(null);
    setWorkflowStep('idle');
    setShowPreChart(false);
    setShowNotePreview(false);
    setSyncResults([]);
    setMetrics({
      patientsToday: 3,
      patientsCompleted: 0,
      timeSavedMinutes: 0,
      stepsEliminated: 0,
      successRate: 100,
      emrsSynced: 0,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Heidi Autopilot</h1>
              <p className="text-sm text-slate-500">Clinical Documentation RPA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/report" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Sync Report
            </a>
            <button onClick={resetDemo} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<Users className="w-5 h-5" />} label="Patients Today" value={metrics.patientsToday} subtext={`${metrics.patientsCompleted} completed`} color="blue" />
          <MetricCard icon={<Clock className="w-5 h-5" />} label="Time Saved" value={`${metrics.timeSavedMinutes} min`} subtext="vs manual entry" color="green" />
          <MetricCard icon={<Zap className="w-5 h-5" />} label="Steps Eliminated" value={metrics.stepsEliminated} subtext="manual clicks avoided" color="yellow" />
          <MetricCard icon={<CheckCircle2 className="w-5 h-5" />} label="Success Rate" value={`${metrics.successRate}%`} subtext={`${metrics.emrsSynced} EMR syncs`} color="purple" />
        </div>

        {/* Workflow Status Banner */}
        {workflowStep !== 'idle' && workflowStep !== 'complete' && (
          <div className="mb-6 bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">RPA Bot Active</p>
                <p className="text-sm text-blue-200">
                  {workflowStep === 'fetching' && 'Fetching note from Heidi...'}
                  {workflowStep === 'normalizing' && 'AI normalizing note format...'}
                  {workflowStep === 'syncing-meddirector' && 'Syncing to MedDirector EMR...'}
                  {workflowStep === 'syncing-bestpractice' && 'Syncing to BestPractice EMR...'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {['fetching', 'normalizing', 'syncing-meddirector', 'syncing-bestpractice'].map((step, i) => (
                <div key={step} className={`w-3 h-3 rounded-full ${
                  workflowStep === step ? 'bg-white animate-pulse' : 
                  ['fetching', 'normalizing', 'syncing-meddirector', 'syncing-bestpractice'].indexOf(workflowStep) > i ? 'bg-white' : 'bg-white/30'
                }`} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today&apos;s Appointments
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {patients.map(patient => (
                <div 
                  key={patient.id}
                  className={`p-4 hover:bg-slate-50 transition cursor-pointer ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowPreChart(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{patient.name}</p>
                      <p className="text-sm text-slate-500">{patient.appointmentTime} - {patient.appointmentType}</p>
                    </div>
                    <StatusBadge status={patient.status} />
                  </div>
                  
                  {/* Quick Summary */}
                  {patient.preChartSummary && (
                    <p className="text-xs text-slate-600 bg-slate-100 rounded-lg p-2 mt-2 line-clamp-2">
                      {patient.preChartSummary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedPatient ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Select a Patient</h3>
                <p className="text-sm text-slate-400">Click on a patient from the list to view their details and manage their workflow.</p>
              </div>
            ) : (
              <>
                {/* Patient Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                        <p className="text-sm text-slate-500">
                          {selectedPatient.gender} • DOB: {selectedPatient.dob} • MRN: {selectedPatient.mrn}
                        </p>
                      </div>
                      <StatusBadge status={selectedPatient.status} large />
                    </div>
                  </div>
                  
                  {/* Action Buttons based on status */}
                  <div className="p-5 bg-slate-50">
                    <PatientActions 
                      patient={selectedPatient}
                      onViewPreChart={() => setShowPreChart(true)}
                      onStartHeidi={() => startHeidiSession(selectedPatient)}
                      onMarkComplete={() => markSessionComplete(selectedPatient)}
                      onFetchAndSync={() => fetchAndPreviewNote(selectedPatient)}
                      onViewEMRs={() => {}}
                      workflowStep={workflowStep}
                    />
                  </div>
                </div>

                {/* Pre-Chart Summary Panel */}
                {showPreChart && selectedPatient.preChartDetails && (
                  <PreChartPanel 
                    details={selectedPatient.preChartDetails} 
                    onClose={() => setShowPreChart(false)}
                  />
                )}

                {/* Sync Complete Panel */}
                {selectedPatient.status === 'synced' && workflowStep === 'complete' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
                    <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Successfully Synced to EMRs
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <a 
                        href={`/emr/meddirector?patient=${encodeURIComponent(selectedPatient.name)}`}
                        target="_blank"
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200 hover:border-green-400 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">MedDirector</p>
                            <p className="text-xs text-green-600">13/13 fields populated</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                      <a 
                        href={`/emr/bestpractice?patient=${encodeURIComponent(selectedPatient.name)}`}
                        target="_blank"
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200 hover:border-green-400 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">BestPractice</p>
                            <p className="text-xs text-green-600">13/13 fields populated</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Note Preview Modal */}
      {showNotePreview && normalizedNote && selectedPatient && (
        <NotePreviewModal 
          note={normalizedNote}
          heidiNote={heidiNote}
          onClose={() => setShowNotePreview(false)}
          onConfirmSync={() => runRPASync(selectedPatient)}
        />
      )}
    </div>
  );
}

// Component: Metric Card
function MetricCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75">{subtext}</p>
    </div>
  );
}

// Component: Status Badge
function StatusBadge({ status, large }: { status: Patient['status']; large?: boolean }) {
  const styles = {
    scheduled: 'bg-slate-100 text-slate-600',
    'pre-charted': 'bg-blue-100 text-blue-700',
    'in-heidi': 'bg-orange-100 text-orange-700',
    'ready-for-sync': 'bg-yellow-100 text-yellow-700',
    'syncing': 'bg-purple-100 text-purple-700',
    synced: 'bg-green-100 text-green-700',
  };

  const labels = {
    scheduled: 'Scheduled',
    'pre-charted': '✨ Pre-charted',
    'in-heidi': '🎙️ In Heidi',
    'ready-for-sync': '📄 Ready to Sync',
    'syncing': '⚡ Syncing...',
    synced: '✓ Synced',
  };

  return (
    <span className={`font-medium rounded-full ${styles[status]} ${large ? 'text-sm px-4 py-2' : 'text-xs px-2 py-1'}`}>
      {labels[status]}
    </span>
  );
}

// Component: Patient Actions
function PatientActions({ patient, onViewPreChart, onStartHeidi, onMarkComplete, onFetchAndSync, workflowStep }: {
  patient: Patient;
  onViewPreChart: () => void;
  onStartHeidi: () => void;
  onMarkComplete: () => void;
  onFetchAndSync: () => void;
  onViewEMRs: () => void;
  workflowStep: WorkflowStep;
}) {
  const isProcessing = workflowStep !== 'idle' && workflowStep !== 'complete';

  return (
    <div className="flex flex-wrap gap-3">
      {/* Pre-Chart Button - Always visible if pre-charted */}
      {patient.preChartDetails && (
        <button
          onClick={onViewPreChart}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          View Pre-Chart Summary
        </button>
      )}

      {/* Status-specific actions */}
      {patient.status === 'scheduled' && (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pre-chart will be generated overnight
        </p>
      )}

      {patient.status === 'pre-charted' && (
        <button
          onClick={onStartHeidi}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition text-sm font-medium"
        >
          <Mic className="w-4 h-4" />
          Start Heidi Session
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      )}

      {patient.status === 'in-heidi' && (
        <>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm">
            <Mic className="w-4 h-4 animate-pulse" />
            Session in Progress...
          </div>
          <button
            onClick={onMarkComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Note Approved
          </button>
        </>
      )}

      {patient.status === 'ready-for-sync' && (
        <button
          onClick={onFetchAndSync}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-sm font-medium disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Fetch Note & Sync to EMRs
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {patient.status === 'synced' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4" />
          All EMRs Updated
        </div>
      )}
    </div>
  );
}

// Component: Pre-Chart Panel
function PreChartPanel({ details, onClose }: { details: PreChartDetails; onClose: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            AI Pre-Chart Summary
          </h3>
          <p className="text-xs text-slate-500">Generated {new Date(details.generatedAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      
      <div className="p-5 space-y-5 max-h-96 overflow-y-auto">
        {/* Summary */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{details.summary}</p>
        </div>

        {/* Last Visit */}
        {details.lastVisit && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Last Visit</h4>
            <p className="text-sm text-slate-700">{details.lastVisit}</p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Active Problems */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Active Problems</h4>
            <ul className="space-y-1">
              {details.activeProblems.map((problem, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {problem}
                </li>
              ))}
            </ul>
          </div>

          {/* Medications */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Pill className="w-3 h-3" /> Medications
            </h4>
            <ul className="space-y-1">
              {details.currentMedications.map((med, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {med}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-red-50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Allergies
          </h4>
          <p className="text-sm text-red-700">{details.allergies.join(', ') || 'No known allergies'}</p>
        </div>

        {/* Pending Results */}
        {details.pendingResults && details.pendingResults.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Pending Results</h4>
            <ul className="space-y-1">
              {details.pendingResults.map((result, i) => (
                <li key={i} className="text-sm text-yellow-800">• {result}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Focus */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Suggested Focus for Today</h4>
          <ul className="space-y-2">
            {details.suggestedFocus.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                <span className="text-green-500 font-bold">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Component: Note Preview Modal
function NotePreviewModal({ note, heidiNote, onClose, onConfirmSync }: {
  note: NormalizedNote;
  heidiNote: HeidiNote | null;
  onClose: () => void;
  onConfirmSync: () => void;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800">Review Note Before Syncing</h3>
            <p className="text-sm text-slate-500">Verify the data before distributing to EMRs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowRaw(false)}
              className={`px-3 py-1 text-sm rounded-lg ${!showRaw ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
            >
              Normalized (for EMRs)
            </button>
            <button
              onClick={() => setShowRaw(true)}
              className={`px-3 py-1 text-sm rounded-lg ${showRaw ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
            >
              Raw Heidi Note
            </button>
          </div>

          {!showRaw ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-xl">
                <div><span className="text-xs text-slate-500">Patient:</span> <span className="font-medium">{note.patient.name}</span></div>
                <div><span className="text-xs text-slate-500">DOB:</span> <span className="font-medium">{note.patient.dob}</span></div>
                <div><span className="text-xs text-slate-500">MRN:</span> <span className="font-medium">{note.patient.mrn}</span></div>
                <div><span className="text-xs text-slate-500">Visit Date:</span> <span className="font-medium">{note.visit.date}</span></div>
              </div>
              <NoteField label="Chief Complaint" value={note.clinical.chiefComplaint} />
              <NoteField label="History of Present Illness" value={note.clinical.hpi} />
              <NoteField label="Assessment" value={note.clinical.assessment} />
              <NoteField label="Plan" value={note.clinical.plan} />
            </div>
          ) : heidiNote && (
            <div className="space-y-4">
              <NoteField label="Chief Complaint" value={heidiNote.chiefComplaint} />
              <NoteField label="HPI" value={heidiNote.historyOfPresentIllness} />
              <NoteField label="Physical Exam" value={heidiNote.physicalExamination} />
              <NoteField label="Assessment" value={heidiNote.assessment} />
              <NoteField label="Plan" value={heidiNote.plan} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmSync}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm & Sync to EMRs
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{value}</p>
    </div>
  );
}
