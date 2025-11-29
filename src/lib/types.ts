// Types for the RPA system

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn: string;
  appointmentTime: string;
  appointmentType: string;
  preChartSummary?: string;
  preChartDetails?: PreChartDetails;
  heidiSessionId?: string;
  heidiSessionUrl?: string;
  status: 'scheduled' | 'pre-charted' | 'in-heidi' | 'ready-for-sync' | 'syncing' | 'synced';
}

export interface PreChartDetails {
  generatedAt: string;
  summary: string;
  relevantHistory: string[];
  lastVisit?: string;
  activeProblems: string[];
  currentMedications: string[];
  allergies: string[];
  pendingResults?: string[];
  suggestedFocus: string[];
}

export interface HeidiNote {
  sessionId: string;
  patientName: string;
  dateOfService: string;
  noteType: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string[];
  allergies: string[];
  physicalExamination: string;
  assessment: string;
  plan: string;
  followUp: string;
  rawTranscript?: string;
}

export interface NormalizedNote {
  // Standard fields that work across EMRs
  patient: {
    name: string;
    dob: string;
    gender: string;
    mrn: string;
  };
  visit: {
    date: string;
    type: string;
    provider: string;
  };
  clinical: {
    chiefComplaint: string;
    hpi: string;
    pmh: string;
    medications: string;
    allergies: string;
    physicalExam: string;
    assessment: string;
    plan: string;
    followUp: string;
  };
}

export interface SyncResult {
  id: string;
  timestamp: string;
  patientName: string;
  emrType: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  fieldsPopulated: number;
  totalFields: number;
  errors?: string[];
  warnings?: string[];
}

export interface DashboardMetrics {
  patientsToday: number;
  patientsCompleted: number;
  timeSavedMinutes: number;
  stepsEliminated: number;
  successRate: number;
  emrsSynced: number;
}

// Mock patient data for demo
export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Mary Jones',
    dob: '1965-03-15',
    gender: 'Female',
    mrn: 'MRN001234',
    appointmentTime: '09:00',
    appointmentType: 'Follow-up',
    preChartSummary: 'Type 2 Diabetes follow-up. Last HbA1c 7.2% (3 months ago). Current meds: Metformin 1000mg BD. Review glucose diary and adjust medications as needed.',
    preChartDetails: {
      generatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      summary: 'Mrs. Jones is returning for her 3-month diabetes follow-up. Her last HbA1c showed improvement from 7.8% to 7.2%. She has been compliant with Metformin and lifestyle modifications. Weight has decreased by 3kg. No hypoglycemic episodes reported.',
      relevantHistory: [
        'Type 2 Diabetes Mellitus - diagnosed 2019',
        'Hypertension - well controlled',
        'Hyperlipidemia - on statin therapy',
        'Obesity - BMI 32, improving'
      ],
      lastVisit: '3 months ago - HbA1c review, increased Metformin to 1000mg BD',
      activeProblems: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
      currentMedications: ['Metformin 1000mg BD', 'Lisinopril 10mg daily', 'Atorvastatin 20mg nocte'],
      allergies: ['Penicillin - rash'],
      pendingResults: ['Fasting glucose (due today)', 'Lipid panel (due today)'],
      suggestedFocus: [
        'Review home glucose diary',
        'Assess medication compliance',
        'Discuss diet and exercise progress',
        'Order HbA1c for next visit',
        'Annual diabetic review checklist'
      ]
    },
    heidiSessionId: '337867880691318956',
    heidiSessionUrl: 'https://app.heidihealth.com/session/337867880691318956',
    status: 'pre-charted'
  },
  {
    id: '2',
    name: 'John Smith',
    dob: '1978-08-22',
    gender: 'Male',
    mrn: 'MRN005678',
    appointmentTime: '09:30',
    appointmentType: 'New Patient',
    preChartSummary: 'New patient referral from cardiology. History of hypertension and recent echo showing mild LVH. Review referral letter and establish care plan.',
    preChartDetails: {
      generatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      summary: 'Mr. Smith is a new patient referred by Dr. Chen (Cardiology) for ongoing management of hypertension with target organ damage. Recent echocardiogram showed mild concentric LVH with preserved ejection fraction (60%). He has multiple cardiovascular risk factors including family history of early MI.',
      relevantHistory: [
        'Hypertension - diagnosed 2022, suboptimally controlled',
        'Mild LVH on echo (2 weeks ago)',
        'Prediabetes - HbA1c 6.1%',
        'Obesity - BMI 31',
        'Family history: Father MI at age 58'
      ],
      lastVisit: 'New patient - no previous visits',
      activeProblems: ['Hypertension with LVH', 'Prediabetes', 'Obesity', 'Cardiovascular risk'],
      currentMedications: ['Amlodipine 5mg daily', 'Aspirin 100mg daily'],
      allergies: ['No known drug allergies'],
      pendingResults: [],
      suggestedFocus: [
        'Review cardiology referral letter',
        'Assess current BP control',
        'Discuss lifestyle modifications (DASH diet, exercise)',
        'Consider adding ACE inhibitor for LVH',
        'Order baseline bloods (renal function, lipids, HbA1c)',
        'Arrange 24-hour BP monitoring'
      ]
    },
    heidiSessionId: '337851254565527952685384877024185083869',
    heidiSessionUrl: 'https://app.heidihealth.com/session/337851254565527952685384877024185083869',
    status: 'pre-charted'
  },
  {
    id: '3',
    name: 'Sarah Williams',
    dob: '1990-11-08',
    gender: 'Female',
    mrn: 'MRN009012',
    appointmentTime: '10:00',
    appointmentType: 'Sick Visit',
    preChartSummary: 'Presenting with 3-day history of cough and fever. No known allergies. Up to date on vaccinations.',
    preChartDetails: {
      generatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      summary: 'Ms. Williams booked online for acute respiratory symptoms. Based on booking notes: 3-day history of productive cough, fever (self-measured 38.2°C), and mild shortness of breath. No recent travel. Works in childcare. Generally healthy young woman.',
      relevantHistory: [
        'Generally healthy',
        'Asthma - childhood, resolved',
        'Appendectomy 2015'
      ],
      lastVisit: '8 months ago - routine health check, all normal',
      activeProblems: ['Acute respiratory illness (presenting complaint)'],
      currentMedications: ['Oral contraceptive pill', 'Vitamin D 1000 IU daily'],
      allergies: ['No known allergies'],
      pendingResults: [],
      suggestedFocus: [
        'Assess severity of respiratory symptoms',
        'Check oxygen saturation',
        'Consider COVID/Flu swab if indicated',
        'Assess for pneumonia signs',
        'Provide symptomatic treatment advice'
      ]
    },
    heidiSessionId: '337871234567890123',
    heidiSessionUrl: 'https://app.heidihealth.com/session/337871234567890123',
    status: 'scheduled'
  }
];

// Mock Heidi note data (simulating what we'd get from Heidi API)
export const MOCK_HEIDI_NOTES: Record<string, HeidiNote> = {
  '337867880691318956': {
    sessionId: '337867880691318956',
    patientName: 'Mary Jones',
    dateOfService: '2024-11-29',
    noteType: 'GP Note',
    chiefComplaint: 'Follow-up for Type 2 Diabetes management',
    historyOfPresentIllness: 'Mrs. Jones presents for routine diabetes follow-up. She reports improved glucose control over the past 3 months with readings mostly between 90-140 mg/dL fasting. She has been compliant with her Metformin 1000mg twice daily. She denies any episodes of hypoglycemia. She reports some fatigue in the afternoons but denies polydipsia or polyuria. She has lost approximately 3kg since last visit through dietary modifications.',
    pastMedicalHistory: 'Type 2 Diabetes Mellitus diagnosed 2019, Hypertension, Hyperlipidemia, Obesity (BMI 32)',
    medications: ['Metformin 1000mg BD', 'Lisinopril 10mg daily', 'Atorvastatin 20mg nocte'],
    allergies: ['Penicillin - rash'],
    physicalExamination: 'BP 132/78, HR 72, Weight 87kg. Alert and oriented. Cardiovascular: Regular rate and rhythm, no murmurs. Respiratory: Clear to auscultation bilaterally. Extremities: No edema, feet exam - sensation intact, no ulcers, pedal pulses present.',
    assessment: 'Type 2 Diabetes Mellitus - improved control. HbA1c improved from 7.8% to 7.2%. Hypertension - well controlled on current regimen.',
    plan: '1. Continue Metformin 1000mg BD\n2. Repeat HbA1c in 3 months\n3. Continue lifestyle modifications - diet and exercise\n4. Annual diabetic review including eye exam and renal function\n5. Reinforce foot care education',
    followUp: 'Return in 3 months for HbA1c review'
  },
  '337851254565527952685384877024185083869': {
    sessionId: '337851254565527952685384877024185083869',
    patientName: 'John Smith',
    dateOfService: '2024-11-29',
    noteType: 'Consult Note',
    chiefComplaint: 'New patient - cardiology referral for hypertension and LVH',
    historyOfPresentIllness: 'Mr. Smith is a 46-year-old male referred by Dr. Chen from cardiology for ongoing management of hypertension and mild left ventricular hypertrophy. He was diagnosed with hypertension 2 years ago after presenting with headaches. Recent echo showed mild concentric LVH with preserved EF of 60%. He reports occasional palpitations but denies chest pain, shortness of breath, or syncope. He admits to high salt intake and minimal exercise. Family history significant for father with MI at age 58.',
    pastMedicalHistory: 'Hypertension diagnosed 2022, Mild LVH on echo, Obesity (BMI 31), Prediabetes',
    medications: ['Amlodipine 5mg daily', 'Aspirin 100mg daily'],
    allergies: ['No known drug allergies'],
    physicalExamination: 'BP 148/92 (elevated), HR 78, Weight 94kg, Height 174cm. Alert, oriented, no acute distress. Cardiovascular: Regular rate and rhythm, S1S2 normal, no murmurs, no JVD. Respiratory: Clear bilaterally. Abdomen: Soft, non-tender, no organomegaly. Extremities: No edema.',
    assessment: 'Hypertension - suboptimally controlled with evidence of target organ damage (LVH). Prediabetes - at risk for progression. Cardiovascular risk - elevated given family history and multiple risk factors.',
    plan: '1. Increase Amlodipine to 10mg daily OR add ACE inhibitor (Perindopril 4mg daily)\n2. Start aggressive lifestyle modifications: DASH diet, reduce salt intake <2g/day, exercise 150min/week\n3. Fasting glucose and HbA1c in 1 week\n4. 24-hour ambulatory BP monitoring\n5. Cardiology follow-up in 6 months for repeat echo\n6. Discussed cardiovascular risk factors and importance of BP control',
    followUp: 'Return in 4 weeks to assess BP control and medication tolerance'
  }
};

// API configuration
export const HEIDI_API_CONFIG = {
  baseUrl: 'https://partner-api.heidihealth.com/v1',
  apiKey: process.env.HEIDI_API_KEY || 'HIztzs28cXKYylG77i0bC283U', // Provided hackathon API key
  sessionIds: [
    '337867880691318956',
    '337851254565527952685384877024185083869',
    '337887654321098765432109876543210987654',
    '337898765432109876543210987654321098765',
    '337809876543210987654321098765432109876',
    '337810987654321098765432109876543210987',
    '337821098765432109876543210987654321098',
    '337832109876543210987654321098765432109'
  ]
};
