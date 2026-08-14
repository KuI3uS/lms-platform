/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearClientSession, setCsrfToken } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        localStorage.removeItem("token");

        apiFetch("/auth/csrf", { skipAuthRedirect: true })
            .then((data) => setCsrfToken(data?.csrfToken))
            .then(() => apiFetch("/me", { skipAuthRedirect: true }))
            .then((currentUser) => {
                if (active) setUser(currentUser);
            })
            .catch(() => {
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        completeLogin(session) {
            setCsrfToken(session?.csrfToken);
            setUser(session?.user || null);
        },
        async logout() {
            try {
                await apiFetch("/auth/logout", {
                    method: "POST",
                    skipAuthRedirect: true
                });
            } finally {
                clearClientSession();
                setUser(null);
            }
        }
    }), [loading, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth wymaga AuthProvider");
    return context;
}
