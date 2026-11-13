import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext.jsx";

export default function ProtectedRoute() {
    const { t } = useLocale();
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="grid min-h-screen place-items-center bg-slate-950 text-cyan-300">{t("Sprawdzanie bezpiecznej sesji…")}</div>;
    }
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}
