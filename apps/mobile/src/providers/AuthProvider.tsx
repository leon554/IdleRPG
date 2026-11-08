//for the backend auth provider add a distinction between a logged in user and a logged i user with a verified email
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";


type User = {
    id: string;
    userName: string;
    emailVerified: boolean;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;          

    signUp: (userName: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    verifyEmail: (code: string) => Promise<void>;
    resendCode: () => Promise<void>;
    logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    
  }, []);

  useEffect(() => {

  }, [loadUser]);

  const signUp = useCallback(async (userName: string, email: string, password: string) => {
  
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
   
  }, [loadUser]);

  const verifyEmail = useCallback(async (code: string) => {

  }, []);

  const resendCode = useCallback(async () => {
    
  }, []);

  const logOut = useCallback(async () => {

  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    signUp, login, verifyEmail, resendCode, logOut,
  }), [user, isLoading, signUp, login, verifyEmail, resendCode, logOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}