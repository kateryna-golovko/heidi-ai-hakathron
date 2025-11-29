// API Route: Normalize note using Gemini
import { NextRequest, NextResponse } from 'next/server';
import { normalizeNoteWithGemini, ruleBasedNormalization } from '@/lib/gemini-normalizer';
import { HeidiNote } from '@/lib/types';
import { syncStore } from '@/lib/sync-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { heidiNote, patientInfo } = body as {
      heidiNote: HeidiNote;
      patientInfo: { dob: string; mrn: string };
    };

    if (!heidiNote) {
      return NextResponse.json({ error: 'Heidi note required' }, { status: 400 });
    }

    // Normalize the note (uses Gemini if available, fallback to rules)
    const normalizedNote = await normalizeNoteWithGemini(heidiNote, patientInfo || { dob: '1970-01-01', mrn: 'MRN000000' });

    // Store for EMR access
    syncStore.storeNormalizedNote(heidiNote.sessionId, normalizedNote);

    return NextResponse.json({
      success: true,
      data: normalizedNote,
      method: process.env.GEMINI_API_KEY ? 'gemini' : 'rules',
    });
  } catch (error: any) {
    console.error('Normalization error:', error);
    return NextResponse.json(
      { error: 'Failed to normalize note', details: error.message },
      { status: 500 }
    );
  }
}
