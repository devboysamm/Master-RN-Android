import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from '../storage/auth';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';

type AuthMode = 'signin' | 'signup';
type TabName = 'Home' | 'Explore' | 'Progress' | 'Chat' | 'Profile';

function toStoredUser(u: authApi.AuthUser): auth.StoredUser {
  return { id: u.id, name: u.name, email: u.email, bio: u.bio ?? null };
}

type AuthState = {
  user: auth.StoredUser | null;
  /** Raw JWT — exposed so authenticated requests can attach it. */
  token: string | null;
  isGuest: boolean;
  hydrated: boolean;
  /**
   * If set, the AuthFlow opens directly on the Auth screen in this mode. Used
   * when a guest taps "Sign in" / "Create account" from a gate.
   */
  pendingAuthMode: AuthMode | null;
  /** Which tab to land on after the AuthFlow exits. */
  pendingReturnTab: TabName | null;

  /** Send a signup OTP. Does NOT authenticate — caller shows the OTP screen. */
  signUp: (email: string, name: string, password: string) => Promise<void>;
  /**
   * Verify the signup OTP. Resolves with a `commit()` you call when ready to
   * actually log the user in (so the screen can show a success moment first).
   */
  verifyOtp: (email: string, code: string) => Promise<() => Promise<void>>;
  /** Log in with email + password → stores token+user → authenticated. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Request a password-reset OTP. */
  forgotPassword: (email: string) => Promise<void>;
  /** Complete a password reset with the emailed OTP. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  /** Update the signed-in user's profile (name / bio) and persist it. */
  updateProfile: (name: string, bio: string) => Promise<void>;

  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  /** Drop into AuthFlow and land on Auth with the given mode pre-selected. */
  requestAuth: (mode: AuthMode, opts?: { returnTo?: TabName }) => Promise<void>;
  /** Bail out of AuthFlow back into the app tabs as a guest. */
  cancelAuth: () => Promise<void>;
  clearPendingReturnTab: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<auth.StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pendingAuthMode, setPendingAuthMode] = useState<AuthMode | null>(null);
  const [pendingReturnTab, setPendingReturnTab] = useState<TabName | null>(null);

  // On launch: restore a stored session and validate it against /me. If there
  // is no session, default to GUEST — the app is guest-first, so launch goes
  // straight into the tabs (no login wall), per the handoff.
  //
  // Whatever happens, we MUST reach setHydrated(true): the splash shows while
  // !hydrated, so a storage read that throws or never settles would strand the
  // app on the brand splash. getSession is therefore raced against a timeout,
  // the whole body is guarded, and persistence writes are fire-and-forget.
  useEffect(() => {
    let alive = true;
    const persistGuest = () => {
      auth.setGuest(true).catch(() => {});
    };
    (async () => {
      try {
        const session = await Promise.race([
          auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        if (!alive) return;
        if (session?.token) {
          // Optimistically restore so the UI doesn't flash.
          setToken(session.token);
          setUserState(session.user);
          try {
            const { user: fresh } = await authApi.me(session.token);
            const stored = toStoredUser(fresh);
            await auth.setSession({ token: session.token, user: stored });
            if (alive) setUserState(stored);
          } catch (err) {
            // Only log out on a real 401 — a network blip shouldn't nuke the
            // session and force a re-login when offline.
            if (err instanceof ApiError && err.status === 401) {
              await auth.clearSession();
              if (!alive) return;
              setToken(null);
              setUserState(null);
              setIsGuest(true);
              persistGuest();
            }
          }
        } else {
          // Guest-first default.
          if (alive) setIsGuest(true);
          persistGuest();
        }
      } catch (err) {
        console.warn('[auth] hydrate failed; continuing as guest', err);
        if (alive) setIsGuest(true);
        persistGuest();
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value: AuthState = useMemo(() => {
    const applySession = async (resp: authApi.TokenResponse) => {
      const stored = toStoredUser(resp.user);
      await auth.setSession({ token: resp.token, user: stored });
      await auth.setGuest(false);
      setToken(resp.token);
      setUserState(stored);
      setIsGuest(false);
      setPendingAuthMode(null);
    };

    return {
      user,
      token,
      isGuest,
      hydrated,
      pendingAuthMode,
      pendingReturnTab,

      signUp: async (email, name, password) => {
        // Sends the OTP email; intentionally does not authenticate.
        await authApi.signup(email, name, password);
      },
      verifyOtp: async (email, code) => {
        const resp = await authApi.verifyOtp(email, code);
        const stored = toStoredUser(resp.user);
        return async () => {
          await auth.setSession({ token: resp.token, user: stored });
          await auth.setGuest(false);
          setPendingReturnTab(null);
          setToken(resp.token);
          setUserState(stored);
          setIsGuest(false);
          setPendingAuthMode(null);
        };
      },
      signIn: async (email, password) => {
        const resp = await authApi.login(email, password);
        await applySession(resp);
      },
      forgotPassword: async (email) => {
        await authApi.forgotPassword(email);
      },
      resetPassword: async (email, code, newPassword) => {
        await authApi.resetPassword(email, code, newPassword);
      },
      updateProfile: async (name, bio) => {
        if (!token) throw new Error('You must be signed in to edit your profile');
        const { user: updated } = await authApi.updateMe(token, { name, bio });
        const stored = toStoredUser(updated);
        await auth.setSession({ token, user: stored });
        setUserState(stored);
      },

      signOut: async () => {
        // Guest-first: signing out returns to the app as a guest, not a wall.
        await auth.clearSession();
        await auth.setGuest(true);
        setToken(null);
        setUserState(null);
        setIsGuest(true);
        setPendingAuthMode(null);
        setPendingReturnTab(null);
      },
      deleteAccount: async () => {
        if (!token) throw new Error('You must be signed in to delete your account');
        await authApi.deleteAccount(token);
        await auth.clearSession();
        await auth.setGuest(true);
        setToken(null);
        setUserState(null);
        setIsGuest(true);
        setPendingAuthMode(null);
        setPendingReturnTab(null);
      },
      continueAsGuest: async () => {
        await auth.setGuest(true);
        setIsGuest(true);
        setPendingAuthMode(null);
      },
      requestAuth: async (mode, opts) => {
        // Set the hints before clearing auth state so AuthFlow mounts with the
        // correct initial route on the next render.
        setPendingAuthMode(mode);
        setPendingReturnTab(opts?.returnTo ?? null);
        await auth.clearSession();
        await auth.setGuest(false);
        setToken(null);
        setUserState(null);
        setIsGuest(false);
      },
      cancelAuth: async () => {
        await auth.setGuest(true);
        setIsGuest(true);
        setPendingAuthMode(null);
      },
      clearPendingReturnTab: () => setPendingReturnTab(null),
    };
  }, [user, token, isGuest, hydrated, pendingAuthMode, pendingReturnTab]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
