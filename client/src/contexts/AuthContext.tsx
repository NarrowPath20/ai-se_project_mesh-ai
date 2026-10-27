import { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { CurrentUser } from '../types';
import { getCurrentUser } from '../utils/api';

type AuthContextValue = {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
  setCurrentUser: Dispatch<SetStateAction<CurrentUser | null>>;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null, isAuthenticated: false, isLoading: false,
  login: () => {}, logout: () => {}, setCurrentUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = currentUser !== null;

  useEffect(() => {
    if (!localStorage.getItem('auth-token')) {
      setIsLoading(false);
      return;
    }
    let active = true;
    getCurrentUser().then((res) => {
      if (active) setCurrentUser(res.data);
    }).catch(() => {
      if (active) {
        localStorage.removeItem('auth-token');
        setCurrentUser(null);
      }
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function login(token: string, user: CurrentUser) {
    localStorage.setItem('auth-token', token);
    setCurrentUser(user);
  }
  function logout() {
    localStorage.removeItem('auth-token');
    setCurrentUser(null);
  }

  return <AuthContext.Provider value={{ currentUser, isAuthenticated, isLoading, login, logout, setCurrentUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
