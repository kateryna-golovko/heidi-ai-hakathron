// Sync state management
import { SyncResult, NormalizedNote, DashboardMetrics } from './types';

// In-memory store (in production, this would be a database)
class SyncStore {
  private syncResults: SyncResult[] = [];
  private normalizedNotes: Map<string, NormalizedNote> = new Map();
  private metrics: DashboardMetrics = {
    patientsToday: 3,
    patientsCompleted: 0,
    timeSavedMinutes: 0,
    stepsEliminated: 0,
    successRate: 100,
    emrsSynced: 0,
  };

  addSyncResult(result: SyncResult) {
    this.syncResults.push(result);
    this.updateMetrics(result);
  }

  getSyncResults(): SyncResult[] {
    return [...this.syncResults];
  }

  getResultsForPatient(patientName: string): SyncResult[] {
    return this.syncResults.filter(r => r.patientName === patientName);
  }

  storeNormalizedNote(sessionId: string, note: NormalizedNote) {
    this.normalizedNotes.set(sessionId, note);
  }

  getNormalizedNote(sessionId: string): NormalizedNote | undefined {
    return this.normalizedNotes.get(sessionId);
  }

  private updateMetrics(result: SyncResult) {
    if (result.status === 'success') {
      this.metrics.patientsCompleted = new Set(
        this.syncResults.filter(r => r.status === 'success').map(r => r.patientName)
      ).size;
      this.metrics.timeSavedMinutes += 22; // Average time saved per sync
      this.metrics.stepsEliminated += 13; // Average steps per EMR entry
      this.metrics.emrsSynced += 1;
    }
    
    const successCount = this.syncResults.filter(r => r.status === 'success').length;
    this.metrics.successRate = Math.round((successCount / this.syncResults.length) * 100);
  }

  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  resetDemo() {
    this.syncResults = [];
    this.normalizedNotes.clear();
    this.metrics = {
      patientsToday: 3,
      patientsCompleted: 0,
      timeSavedMinutes: 0,
      stepsEliminated: 0,
      successRate: 100,
      emrsSynced: 0,
    };
  }
}

// Singleton instance
export const syncStore = new SyncStore();
