// Heidi API Client
import { HEIDI_API_CONFIG, HeidiNote, MOCK_HEIDI_NOTES } from './types';

export class HeidiClient {
  private baseUrl: string;
  private apiKey: string;
  private jwtToken: string | null = null;

  constructor() {
    this.baseUrl = HEIDI_API_CONFIG.baseUrl;
    this.apiKey = HEIDI_API_CONFIG.apiKey;
  }

  // Authenticate and get JWT token
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jwt?email=demo@hackathon.com&third_party_internal_id=12345`,
        {
          method: 'GET',
          headers: {
            'Heidi-Api-Key': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.jwtToken = data.token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Heidi authentication error:', error);
      return false;
    }
  }

  // Fetch a session from Heidi API
  async fetchSession(sessionId: string): Promise<HeidiNote | null> {
    // First, try to use the real API
    if (this.jwtToken) {
      try {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return this.transformHeidiResponse(data);
        }
      } catch (error) {
        console.error('Heidi API error, falling back to mock:', error);
      }
    }

    // Fallback to mock data for demo
    return MOCK_HEIDI_NOTES[sessionId] || this.generateMockNote(sessionId);
  }

  // Transform Heidi API response to our format
  private transformHeidiResponse(data: any): HeidiNote {
    // The actual Heidi API structure may vary - this handles common patterns
    const session = data.session || data;
    const note = data.consult_note || session.consult_note || {};
    
    return {
      sessionId: session.id || session.session_id,
      patientName: session.patient?.name || note.patient_name || 'Unknown Patient',
      dateOfService: session.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      noteType: note.note_type || 'GP Note',
      chiefComplaint: note.chief_complaint || note.presenting_complaint || '',
      historyOfPresentIllness: note.hpi || note.history_of_present_illness || '',
      pastMedicalHistory: note.pmh || note.past_medical_history || '',
      medications: Array.isArray(note.medications) ? note.medications : (note.medications?.split(',') || []),
      allergies: Array.isArray(note.allergies) ? note.allergies : (note.allergies?.split(',') || []),
      physicalExamination: note.physical_exam || note.examination || '',
      assessment: note.assessment || note.diagnosis || '',
      plan: note.plan || note.management || '',
      followUp: note.follow_up || note.review || '',
      rawTranscript: session.transcript || data.transcript,
    };
  }

  // Generate mock note for demo purposes
  private generateMockNote(sessionId: string): HeidiNote {
    return {
      sessionId,
      patientName: 'Demo Patient',
      dateOfService: new Date().toISOString().split('T')[0],
      noteType: 'GP Note',
      chiefComplaint: 'Routine health check',
      historyOfPresentIllness: 'Patient presents for routine health check. No specific complaints today. Reports feeling well overall with good energy levels and normal appetite.',
      pastMedicalHistory: 'Generally healthy, no significant past medical history',
      medications: ['Vitamin D 1000 IU daily'],
      allergies: ['No known allergies'],
      physicalExamination: 'BP 120/80, HR 72, Weight 70kg. General: Well-appearing. CVS: Normal heart sounds. Resp: Clear. Abdomen: Soft, non-tender.',
      assessment: 'Healthy adult - routine check satisfactory',
      plan: '1. Continue current lifestyle\n2. Routine blood tests if due\n3. Encourage regular exercise and healthy diet',
      followUp: 'Annual review in 12 months'
    };
  }
}

// Singleton instance
export const heidiClient = new HeidiClient();
