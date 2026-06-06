// Phase 1 guest stub: guests have no saved progress, so there is no "last
// lesson" to resume. Real on-device persistence (AsyncStorage) lands in a
// later phase; the shape matches what the Home screen reads.

export type LastLesson = {
  lessonId: number;
  moduleId: number;
  moduleNumber?: number;
  lessonNumber?: number;
  totalLessons?: number;
  lessonTitle?: string;
};

export function useLastLesson(): { lastLesson: LastLesson | null } {
  return { lastLesson: null };
}

// No-op for now. Persisting the "last opened" lesson (so Home's continue card
// resumes here) is progress tracking, deferred to a later phase.
export function setLastLesson(_lesson: {
  lessonId: number;
  moduleId: number;
  lessonTitle?: string;
  moduleTitle?: string | null;
  lessonNumber?: number;
  totalLessons?: number;
  moduleNumber?: number;
  updatedAt?: number;
}): void {}
