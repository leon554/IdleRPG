//for the backend auth provider add a distinction between a logged in user and a logged i user with a verified email
import { clearToken, getToken, saveToken } from "@/auth/token";
import { getAuthState } from "@/auth/util";
import { request, setUnauthorizedHandler } from "@/lib/api-service-layer/util";
import { AuthState, User } from "@idlerpg/shared";
import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,} from "react";

const DEFAULT_RESEND_COOLDOWN_MS = 60 * 1000;
export type PublicUser = Omit<User, "passwordHash" | "emailVerifiedAt"> & {
  emailVerifiedAt: string | null;
};

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;        
  authState: AuthState;
  resendAvailableAt: number;  

  signUp: (userName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [resendAvailableAt, setResendAvailableAt] = useState(0);
    const authState = useMemo(() => getAuthState(user), [user]);

    const loadUser = useCallback(async () => {
        const me = await request<PublicUser>("/auth/get-user");
        setUser(me);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => setUser(null));
        return () => setUnauthorizedHandler(null);
    }, []);


    useEffect(() => {
        (async () => {
            try {
                if (await getToken()) await loadUser();
            } catch {
                await clearToken();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [loadUser]);

    const signUp = useCallback(async (userName: string, email: string, password: string) => {
        const { token } = await request<{ token: string }>("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ userName, email, password }),
        });
        await saveToken(token);
        await loadUser();
        setResendAvailableAt(Date.now() + DEFAULT_RESEND_COOLDOWN_MS); 
    },[loadUser],);

    const login = useCallback(async (email: string, password: string) => {
        const { token } = await request<{ token: string }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        await saveToken(token);
        await loadUser();
    },[loadUser],);

    const verifyEmail = useCallback(async (code: string) => {
        await request("/auth/verify-email-code", {
            method: "POST",
            body: JSON.stringify({ emailCode: code }),
        });
        setUser((prev) => (prev ? { ...prev, emailVerifiedAt: new Date().toISOString() } : prev));
    }, []);

    const resendCode = useCallback(async () => {
        const { retryAfter } = await request<{ sent: boolean; retryAfter: number }>(
            "/auth/send-new-email-code",
            { method: "POST" },
        );
        setResendAvailableAt(Date.now() + retryAfter * 1000);
    }, []);

    const logOut = useCallback(async () => {
   
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoading,
            authState,
            resendAvailableAt,
            signUp,
            login,
            verifyEmail,
            resendCode,
            logOut,
        }),
        [user, isLoading, authState, resendAvailableAt, signUp, login, verifyEmail, resendCode, logOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}