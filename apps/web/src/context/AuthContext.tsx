import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import {
  getStoredAccessToken,
  getStoredUser,
  setStoredAccessToken,
  setStoredUser,
  vixirApi,
  type RegisterPayload,
  type UserProfile,
  type UserRole,
} from '../lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(() =>
    initialUser !== undefined ? initialUser : getStoredUser()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    initialUser === undefined && Boolean(getStoredAccessToken()) && !getStoredUser()
  );

  const refreshProfile = async (): Promise<UserProfile | null> => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await vixirApi.getMe();
      setUser(me);
      setStoredUser(me);
      return me;
    } catch {
      setStoredAccessToken(null);
      setStoredUser(null);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    if (initialUser !== undefined) return;
    const token = getStoredAccessToken();
    if (!token) return;
    let cancelled = false;
    vixirApi
      .getMe()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setStoredUser(me);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStoredAccessToken(null);
          setStoredUser(null);
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const me = await vixirApi.login(email, password);
    setUser(me);
    setStoredUser(me);
    return me;
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    const me = await vixirApi.register(payload);
    setUser(me);
    setStoredUser(me);
    return me;
  };

  const logout = async (): Promise<void> => {
    await vixirApi.logout().catch(() => {});
    setStoredAccessToken(null);
    setStoredUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && getStoredAccessToken()),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for isolated component unit tests rendered outside AuthProvider
    const stored = getStoredUser();
    return {
      user: stored,
      isAuthenticated: Boolean(stored),
      isLoading: false,
      login: (email, password) => vixirApi.login(email, password),
      register: (payload) => vixirApi.register(payload),
      logout: () => vixirApi.logout(),
      refreshProfile: async () => getStoredUser(),
    };
  }
  return ctx;
}

/**
 * Route guard: requires an authenticated user in AuthContext.
 * Only `/`, `/auth`, and the public Pendulum Demo (`/lab/physics/pendulum`, `/lab/physics/pendulum/setup`)
 * are accessible without signing in. All other pages redirect to `/auth?next=<path>`.
 */
export function RequireAuth({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-[#E6EBF5] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#38BDF8] border-t-transparent animate-spin mx-auto" />
          <div className="font-mono text-xs text-[#93A0B8]">
            Verifying your Vixir session...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !getStoredAccessToken()) {
    const nextParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${nextParam}`} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallbackRoute =
      user.role === 'TEACHER' ? '/teacher' : user.role === 'ADMIN' ? '/admin' : '/app';
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}
