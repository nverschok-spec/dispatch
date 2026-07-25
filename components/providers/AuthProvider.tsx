'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, getClaims } from '@/lib/firebase/auth';
import type { User } from '@/lib/firebase/auth';
import type { CustomClaims } from '@/lib/types';

interface AuthState {
  user: User | null;
  claims: CustomClaims | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, claims: null, loading: true, refreshClaims: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, claims: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const claims = await getClaims(user);
        setState({ user, claims, loading: false });
      } else {
        setState({ user: null, claims: null, loading: false });
      }
    });
  }, []);

  // Force-refreshes the ID token (e.g. after server-side Custom Claims were
  // just set, as in /register) and syncs the result into the shared auth state.
  async function refreshClaims() {
    const user = auth.currentUser;
    if (!user) return;
    const claims = await getClaims(user, true);
    setState({ user, claims, loading: false });
  }

  return <AuthContext.Provider value={{ ...state, refreshClaims }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
