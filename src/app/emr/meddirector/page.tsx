'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, User, Calendar, FileText, Pill, AlertCircle, Stethoscope, ClipboardList, ArrowLeft } from 'lucide-react';
import { MOCK_HEIDI_NOTES } from '@/lib/types';

function MedDirectorContent() {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* MedDirector Header - Blue theme */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MedDirector EMR</h1>
              <p className="text-sm text-blue-200">Electronic Medical Records</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Dr. Demo Provider
            </span>
            <a href="/dashboard" className="text-sm text-blue-200 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* RPA Status Banner */}
      <div className={`${animationComplete ? 'bg-green-500' : 'bg-blue-500'} text-white py-2 px-4 text-center text-sm font-medium transition-colors duration-500`}>
        {animationComplete ? (
          <span className="flex items-center justify-center gap-2">
            ✓ RPA Complete - All fields populated automatically from Heidi
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> RPA Bot filling fields...
          </span>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Patient Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Patient Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            <EMRField label="Patient Name" value={fields.patientName.value} filled={fields.patientName.filled} />
            <EMRField label="Date of Birth" value={fields.dob.value} filled={fields.dob.filled} />
            <EMRField label="Gender" value={fields.gender.value} filled={fields.gender.filled} />
            <EMRField label="MRN" value={fields.mrn.value} filled={fields.mrn.filled} />
          </div>
        </div>

        {/* Visit Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Visit Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <EMRField label="Visit Date" value={fields.visitDate.value} filled={fields.visitDate.filled} />
            <EMRField label="Visit Type" value={fields.visitType.value} filled={fields.visitType.filled} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Chief Complaint & HPI */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Clinical Notes
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <EMRField label="Chief Complaint" value={fields.chiefComplaint.value} filled={fields.chiefComplaint.filled} multiline />
                <EMRField label="History of Present Illness" value={fields.hpi.value} filled={fields.hpi.filled} multiline large />
                <EMRField label="Past Medical History" value={fields.pmh.value} filled={fields.pmh.filled} multiline />
              </div>
            </div>

            {/* Medications & Allergies */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-600" />
                  Medications & Allergies
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <EMRField label="Current Medications" value={fields.medications.value} filled={fields.medications.filled} multiline />
                <EMRField label="Allergies" value={fields.allergies.value} filled={fields.allergies.filled} highlight />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Physical Exam */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Physical Examination
                </h2>
              </div>
              <div className="p-6">
                <EMRField label="Examination Findings" value={fields.physicalExam.value} filled={fields.physicalExam.filled} multiline large />
              </div>
            </div>

            {/* Assessment & Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  Assessment & Plan
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <EMRField label="Assessment" value={fields.assessment.value} filled={fields.assessment.filled} multiline />
                <EMRField label="Plan" value={fields.plan.value} filled={fields.plan.filled} multiline large />
                <EMRField label="Follow-up" value={fields.followUp.value} filled={fields.followUp.filled} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Sign & Complete
          </button>
        </div>
      </main>
    </div>
  );
}

function EMRField({ label, value, filled, multiline, large, highlight }: {
  label: string;
  value: string;
  filled: boolean;
  multiline?: boolean;
  large?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          readOnly
          rows={large ? 6 : 3}
          className={`w-full px-3 py-2 border rounded-lg text-sm resize-none transition-all duration-300 ${
            filled 
              ? 'border-green-400 bg-green-50 field-filling' 
              : 'border-slate-200 bg-slate-50'
          } ${highlight ? 'border-red-300 bg-red-50' : ''}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 ${
            filled 
              ? 'border-green-400 bg-green-50 field-filling' 
              : 'border-slate-200 bg-slate-50'
          } ${highlight ? 'border-red-300 bg-red-50' : ''}`}
        />
      )}
    </div>
  );
}

export default function MedDirectorEMR() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MedDirectorContent />
    </Suspense>
  );
}
