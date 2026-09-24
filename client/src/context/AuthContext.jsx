import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    fetchCurrentUser,
    loginWithCredentials,
    logoutSession,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    const restoreSession = useCallback(async () => {
        setAuthError("");
        try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
        } catch (error) {
            setUser(null);
            setAuthError(error.message || "Unable to restore session");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const login = useCallback(async (email, password) => {
        setAuthError("");
        const authenticatedUser = await loginWithCredentials(email, password);
        setUser(authenticatedUser);
        return authenticatedUser;
    }, []);

    const logout = useCallback(async () => {
        setAuthError("");
        await logoutSession();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            authError,
            login,
            logout,
            clearAuthError: () => setAuthError(""),
        }),
        [user, loading, authError, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
