'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, User, FileText, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_HEIDI_NOTES } from '@/lib/types';

function BestPracticeContent() {
  const searchParams = useSearchParams();
  const patientName = searchParams.get('patient') || 'Mary Jones';
  
  const [fields, setFields] = useState<Record<string, { value: string; filled: boolean }>>({
    patientName: { value: '', filled: false },
    dob: { value: '', filled: false },
    gender: { value: '', filled: false },
    mrn: { value: '', filled: false },
    visitDate: { value: '', filled: false },
    visitType: { value: '', filled: false },
    chiefComplaint: { value: '', filled: false },
    hpi: { value: '', filled: false },
    pmh: { value: '', filled: false },
    medications: { value: '', filled: false },
    allergies: { value: '', filled: false },
    physicalExam: { value: '', filled: false },
    assessment: { value: '', filled: false },
    plan: { value: '', filled: false },
    followUp: { value: '', filled: false },
  });

  const [animationComplete, setAnimationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'clinical' | 'plan'>('summary');

  // Get the note data
  const note = patientName === 'John Smith' 
    ? MOCK_HEIDI_NOTES['337851254565527952685384877024185083869']
    : MOCK_HEIDI_NOTES['337867880691318956'];

  // Simulate RPA filling fields one by one
  useEffect(() => {
    const fieldData: Record<string, string> = {
      patientName: note?.patientName || patientName,
      dob: patientName === 'Mary Jones' ? '1965-03-15' : '1978-08-22',
      gender: patientName === 'Mary Jones' ? 'Female' : 'Male',
      mrn: patientName === 'Mary Jones' ? 'MRN001234' : 'MRN005678',
      visitDate: note?.dateOfService || new Date().toISOString().split('T')[0],
      visitType: note?.noteType || 'GP Note',
      chiefComplaint: note?.chiefComplaint || '',
      hpi: note?.historyOfPresentIllness || '',
      pmh: note?.pastMedicalHistory || '',
      medications: note?.medications?.join('; ') || '',
      allergies: note?.allergies?.join('; ') || '',
      physicalExam: note?.physicalExamination || '',
      assessment: note?.assessment || '',
      plan: note?.plan || '',
      followUp: note?.followUp || '',
    };

    const fieldOrder = Object.keys(fieldData);
    let currentIndex = 0;

    const fillInterval = setInterval(() => {
      if (currentIndex < fieldOrder.length) {
        const fieldName = fieldOrder[currentIndex];
        setFields(prev => ({
          ...prev,
          [fieldName]: { value: fieldData[fieldName], filled: true }
        }));
        currentIndex++;
      } else {
        clearInterval(fillInterval);
        setAnimationComplete(true);
      }
    }, 150);

    return () => clearInterval(fillInterval);
  }, [note, patientName]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* BestPractice Header - Purple/Magenta theme */}
      <header className="bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Best Practice EMR</h1>
              <p className="text-sm text-purple-200">Practice Management Software</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Dr. Demo Provider
            </span>
            <a href="/dashboard" className="text-sm text-purple-200 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* RPA Status Banner */}
      <div className={`${animationComplete ? 'bg-emerald-500' : 'bg-purple-500'} text-white py-2 px-4 text-center text-sm font-medium transition-colors duration-500`}>
        {animationComplete ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            RPA Complete - Documentation synced from Heidi
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Syncing data from Heidi via RPA...
          </span>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Patient Summary */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
                <h2 className="font-semibold text-purple-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <BPField label="Name" value={fields.patientName.value} filled={fields.patientName.filled} />
                <BPField label="DOB" value={fields.dob.value} filled={fields.dob.filled} />
                <BPField label="Gender" value={fields.gender.value} filled={fields.gender.filled} />
                <BPField label="MRN" value={fields.mrn.value} filled={fields.mrn.filled} />
                
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <BPField label="Visit Date" value={fields.visitDate.value} filled={fields.visitDate.filled} />
                  <BPField label="Type" value={fields.visitType.value} filled={fields.visitType.filled} />
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  <p className="text-xs font-semibold text-red-600 uppercase mb-1">Allergies</p>
                  <div className={`text-sm p-2 rounded border transition-all duration-300 ${
                    fields.allergies.filled 
                      ? 'bg-red-50 border-red-300 text-red-800' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {fields.allergies.value || '-'}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Current Medications</p>
                  <div className={`text-sm p-2 rounded border transition-all duration-300 ${
                    fields.medications.filled 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {fields.medications.value?.split(';').map((med, i) => (
                      <div key={i} className="py-0.5">{med.trim()}</div>
                    )) || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Tabbed Interface */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 flex">
              <TabButton 
                active={activeTab === 'summary'} 
                onClick={() => setActiveTab('summary')}
                label="Summary"
              />
              <TabButton 
                active={activeTab === 'clinical'} 
                onClick={() => setActiveTab('clinical')}
                label="Clinical Notes"
              />
              <TabButton 
                active={activeTab === 'plan'} 
                onClick={() => setActiveTab('plan')}
                label="Assessment & Plan"
              />
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200">
              {activeTab === 'summary' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Chief Complaint
                    </h3>
                    <BPTextArea value={fields.chiefComplaint.value} filled={fields.chiefComplaint.filled} rows={2} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      History of Present Illness
                    </h3>
                    <BPTextArea value={fields.hpi.value} filled={fields.hpi.filled} rows={6} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Past Medical History
                    </h3>
                    <BPTextArea value={fields.pmh.value} filled={fields.pmh.filled} rows={3} />
                  </div>
                </div>
              )}

              {activeTab === 'clinical' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Physical Examination
                    </h3>
                    <BPTextArea value={fields.physicalExam.value} filled={fields.physicalExam.filled} rows={8} />
                  </div>
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Assessment
                    </h3>
                    <BPTextArea value={fields.assessment.value} filled={fields.assessment.filled} rows={4} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Management Plan
                    </h3>
                    <BPTextArea value={fields.plan.value} filled={fields.plan.filled} rows={6} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Follow-up
                    </h3>
                    <BPTextArea value={fields.followUp.value} filled={fields.followUp.filled} rows={2} />
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleTimeString()} via Heidi Autopilot RPA
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium">
                  Edit Manually
                </button>
                <button className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                  Finalise Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BPField({ label, value, filled }: { label: string; value: string; filled: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-sm font-medium transition-all duration-300 ${
        filled ? 'text-slate-900' : 'text-slate-300'
      }`}>
        {value || '-'}
      </p>
    </div>
  );
}

function BPTextArea({ value, filled, rows }: { value: string; filled: boolean; rows: number }) {
  return (
    <textarea
      value={value}
      readOnly
      rows={rows}
      className={`w-full px-4 py-3 border-2 rounded-lg text-sm resize-none transition-all duration-300 ${
        filled 
          ? 'border-purple-400 bg-purple-50 text-slate-800' 
          : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
    />
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium transition-colors ${
        active 
          ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

export default function BestPracticeEMR() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BestPracticeContent />
    </Suspense>
  );
}
