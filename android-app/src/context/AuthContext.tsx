// Phase 1 guest-only auth. The app is guest-first, so for now there is no
// token and no signed-in user. Real sign-up / sign-in / session persistence
// lands in a later phase (handoff Section 3); screens already read this hook,
// so swapping in the real provider then needs no screen changes.

export type AuthState = {
  user: { name: string } | null;
  isGuest: boolean;
  token: string | null;
};

export function useAuth(): AuthState {
  return { user: null, isGuest: true, token: null };
}
