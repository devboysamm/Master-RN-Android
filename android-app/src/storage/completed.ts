// Phase 2 guest stub: guests have no completed lessons, so progress is always
// empty and nothing is ever "completed". Real on-device persistence
// (AsyncStorage) lands in a later phase.

export function useCompleted(): {
  completed: number[];
  isCompleted: (id: number) => boolean;
  markCompleted: (id: number) => void;
} {
  return {
    completed: [],
    isCompleted: (_id: number) => false,
    // No-op for now: marking a lesson complete is progress tracking, deferred.
    markCompleted: (_id: number) => {},
  };
}
