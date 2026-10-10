import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi, setAccessToken, setSessionEndHandler } from '../api/client.js';

const AuthContext = createContext(null);

const IDLE_MS = 10 * 60 * 1000;
const REFRESH_EVERY_MS = 7 * 60 * 1000;
const TICK_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());

  const endSession = useCallback((message) => {
    setAccessToken(null);
    setUser(null);
    setNotice(message || '');
  }, []);

  useEffect(() => {
    setSessionEndHandler(() => endSession('Your session has expired. Please sign in again.'));
    let cancelled = false;
    authApi
      .restore()
      .then((data) => {
        if (cancelled) return;
        lastRefresh.current = Date.now();
        setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endSession]);

  useEffect(() => {
    if (!user) return undefined;

    lastActivity.current = Date.now();
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, markActive, { passive: true }));

    const timer = setInterval(async () => {
      const now = Date.now();

      if (now - lastActivity.current >= IDLE_MS) {
        try {
          await authApi.logout();
        } catch {
        }
        endSession('You were signed out after 10 minutes of inactivity.');
        return;
      }

      const dueForRefresh = now - lastRefresh.current >= REFRESH_EVERY_MS;
      const activeSinceRefresh = lastActivity.current > lastRefresh.current;
      if (dueForRefresh && activeSinceRefresh) {
        try {
          await authApi.restore();
          lastRefresh.current = Date.now();
        } catch (err) {
          if (err.status === 401) endSession('Your session has expired. Please sign in again.');
        }
      }
    }, TICK_MS);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, markActive));
    };
  }, [user, endSession]);

  const login = useCallback(async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    lastRefresh.current = Date.now();
    setNotice('');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    }
    endSession('');
  }, [endSession]);

  const value = useMemo(
    () => ({ user, loading, notice, login, logout }),
    [user, loading, notice, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}