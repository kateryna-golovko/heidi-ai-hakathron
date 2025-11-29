// Gemini AI integration for note normalization
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HeidiNote, NormalizedNote } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function normalizeNoteWithGemini(heidiNote: HeidiNote, patientInfo: { dob: string; mrn: string }): Promise<NormalizedNote> {
  // If no API key, use rule-based normalization
  if (!process.env.GEMINI_API_KEY) {
    return ruleBasedNormalization(heidiNote, patientInfo);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a medical documentation assistant. Given the following clinical note, extract and normalize the information into a standardized format suitable for EMR entry.

INPUT NOTE:
Patient: ${heidiNote.patientName}
Date: ${heidiNote.dateOfService}
Note Type: ${heidiNote.noteType}

Chief Complaint: ${heidiNote.chiefComplaint}

History of Present Illness: ${heidiNote.historyOfPresentIllness}

Past Medical History: ${heidiNote.pastMedicalHistory}

Medications: ${heidiNote.medications.join(', ')}

Allergies: ${heidiNote.allergies.join(', ')}

Physical Examination: ${heidiNote.physicalExamination}

Assessment: ${heidiNote.assessment}

Plan: ${heidiNote.plan}

Follow-up: ${heidiNote.followUp}

Please respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "patient": {
    "name": "extracted patient name",
    "dob": "${patientInfo.dob}",
    "gender": "inferred gender or Unknown",
    "mrn": "${patientInfo.mrn}"
  },
  "visit": {
    "date": "YYYY-MM-DD format",
    "type": "visit type",
    "provider": "Dr. Provider Name"
  },
  "clinical": {
    "chiefComplaint": "concise chief complaint",
    "hpi": "formatted HPI",
    "pmh": "formatted past medical history",
    "medications": "medications as semicolon-separated list",
    "allergies": "allergies as semicolon-separated list",
    "physicalExam": "formatted exam findings",
    "assessment": "formatted assessment",
    "plan": "formatted plan",
    "followUp": "follow up instructions"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean the response (remove markdown if present)
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```json?\n?/g, '').replace(/```/g, '');
    }
    
    const normalized = JSON.parse(cleanResponse) as NormalizedNote;
    return normalized;
  } catch (error) {
    console.error('Gemini normalization error:', error);
    // Fallback to rule-based normalization
    return ruleBasedNormalization(heidiNote, patientInfo);
  }
}

// Rule-based normalization (fallback)
function ruleBasedNormalization(heidiNote: HeidiNote, patientInfo: { dob: string; mrn: string }): NormalizedNote {
  // Infer gender from name/pronouns in HPI
  let gender = 'Unknown';
  const hpiLower = heidiNote.historyOfPresentIllness.toLowerCase();
  if (hpiLower.includes('she ') || hpiLower.includes('her ') || hpiLower.includes('mrs.') || hpiLower.includes('ms.')) {
    gender = 'Female';
  } else if (hpiLower.includes('he ') || hpiLower.includes('his ') || hpiLower.includes('mr.')) {
    gender = 'Male';
  }

  return {
    patient: {
      name: heidiNote.patientName,
      dob: patientInfo.dob,
      gender,
      mrn: patientInfo.mrn,
    },
    visit: {
      date: heidiNote.dateOfService,
      type: heidiNote.noteType,
      provider: 'Dr. Demo Provider',
    },
    clinical: {
      chiefComplaint: heidiNote.chiefComplaint,
      hpi: heidiNote.historyOfPresentIllness,
      pmh: heidiNote.pastMedicalHistory,
      medications: heidiNote.medications.join('; '),
      allergies: heidiNote.allergies.join('; '),
      physicalExam: heidiNote.physicalExamination,
      assessment: heidiNote.assessment,
      plan: heidiNote.plan,
      followUp: heidiNote.followUp,
    },
  };
}

export { ruleBasedNormalization };
