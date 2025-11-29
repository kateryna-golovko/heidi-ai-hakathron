// API Route: Sync to EMRs
import { NextRequest, NextResponse } from 'next/server';
import { syncStore } from '@/lib/sync-store';
import { SyncResult, NormalizedNote } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, emrType, normalizedNote } = body as {
      sessionId: string;
      emrType: string;
      normalizedNote: NormalizedNote;
    };

    if (!normalizedNote || !emrType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simulate RPA sync (in production, this would control the EMR UI)
    const syncResult = simulateRPASync(normalizedNote, emrType);

    // Store the result
    syncStore.addSyncResult(syncResult);

    return NextResponse.json({
      success: true,
      result: syncResult,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return all sync results and metrics
  return NextResponse.json({
    results: syncStore.getSyncResults(),
    metrics: syncStore.getMetrics(),
  });
}

function simulateRPASync(note: NormalizedNote, emrType: string): SyncResult {
  // Simulate field mapping and validation
  const fields = [
    { name: 'Patient Name', value: note.patient.name, valid: !!note.patient.name },
    { name: 'DOB', value: note.patient.dob, valid: !!note.patient.dob },
    { name: 'MRN', value: note.patient.mrn, valid: !!note.patient.mrn },
    { name: 'Visit Date', value: note.visit.date, valid: !!note.visit.date },
    { name: 'Chief Complaint', value: note.clinical.chiefComplaint, valid: !!note.clinical.chiefComplaint },
    { name: 'HPI', value: note.clinical.hpi, valid: !!note.clinical.hpi },
    { name: 'PMH', value: note.clinical.pmh, valid: !!note.clinical.pmh },
    { name: 'Medications', value: note.clinical.medications, valid: !!note.clinical.medications },
    { name: 'Allergies', value: note.clinical.allergies, valid: !!note.clinical.allergies },
    { name: 'Physical Exam', value: note.clinical.physicalExam, valid: !!note.clinical.physicalExam },
    { name: 'Assessment', value: note.clinical.assessment, valid: !!note.clinical.assessment },
    { name: 'Plan', value: note.clinical.plan, valid: !!note.clinical.plan },
    { name: 'Follow-up', value: note.clinical.followUp, valid: !!note.clinical.followUp },
  ];

  const populatedFields = fields.filter(f => f.valid).length;
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for potential issues
  if (!note.clinical.allergies || note.clinical.allergies.includes('No known')) {
    warnings.push('Verify allergy status with patient');
  }

  if (note.clinical.plan.length < 20) {
    warnings.push('Plan section may be incomplete');
  }

  // Determine status
  let status: 'success' | 'warning' | 'error' = 'success';
  if (errors.length > 0) status = 'error';
  else if (warnings.length > 0) status = 'warning';

  return {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    patientName: note.patient.name,
    emrType,
    status,
    message: status === 'success' 
      ? `Successfully synced to ${emrType}` 
      : `Synced to ${emrType} with ${warnings.length} warning(s)`,
    fieldsPopulated: populatedFields,
    totalFields: fields.length,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
