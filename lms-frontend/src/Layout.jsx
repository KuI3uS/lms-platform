import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import "./styles/workspace-product.css";
import { apiFetch } from "./api/api";
import { useAuth } from "./context/AuthContext";
import { getWorkspaceTheme, WORKSPACE_BACKGROUNDS } from "./utils/workspaceTheme";
import { useLocale } from "./context/LocaleContext";

export default function Layout() {
    const { t } = useLocale();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const role = user?.role || "";
    const sidebarRef = useRef(null);
    const menuTriggerRef = useRef(null);

    const isLessonPage = location.pathname.startsWith("/lesson/");
    const workspaceTheme = getWorkspaceTheme(location.pathname);
    const lightWorkspace = workspaceTheme === "light";
    const closeMenu = () => setMobileMenuOpen(false);
    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 1024px)");
        if (!mobileMenuOpen || desktop.matches) return undefined;
        const sidebar = sidebarRef.current;
        const focusable = () => [...(sidebar?.querySelectorAll(
            'a[href], button:not([disabled]), summary, [tabindex="0"]'
        ) || [])].filter(element => element.getClientRects().length > 0);
        focusable()[0]?.focus();
        const handleKey = event => {
            if (desktop.matches) return;
            if (event.key === "Escape") {
                event.preventDefault();
                setMobileMenuOpen(false);
            } else if (event.key === "Tab") {
                const items = focusable();
                const first = items[0];
                const last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };
        const closeOnDesktop = event => {
            if (event.matches) setMobileMenuOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        desktop.addEventListener("change", closeOnDesktop);
        return () => {
            document.removeEventListener("keydown", handleKey);
            desktop.removeEventListener("change", closeOnDesktop);
            menuTriggerRef.current?.focus();
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const heartbeat = () => {
            if (document.visibilityState === "visible") {
                apiFetch("/learning/heartbeat", { method: "POST" }).catch(() => {});
            }
        };
        heartbeat();
        const timer = window.setInterval(heartbeat, 15000);
        document.addEventListener("visibilitychange", heartbeat);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", heartbeat);
        };
    }, []);

    if (isLessonPage) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="workspace-shell product-shell flex h-[100dvh] overflow-hidden bg-[#f6f8fa] text-slate-900">
            <a className="product-skip-link" href="#workspace-content">{t("Przejdź do treści")}</a>
            {mobileMenuOpen && <button type="button" aria-label={t("Zamknij menu")} tabIndex={-1} onClick={closeMenu} className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" />}
            <aside ref={sidebarRef} aria-label={t("Menu główne")} className={`workspace-sidebar product-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(17rem,86vw)] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${mobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"}`}>
                <WorkspaceSidebar role={role} onClose={closeMenu} />
            </aside>
            <div className="flex min-w-0 flex-1 flex-col" inert={mobileMenuOpen ? true : undefined}>
                <Navbar onMenuClick={event => {
                    menuTriggerRef.current = event.currentTarget;
                    setMobileMenuOpen(true);
                }} />
                <main id="workspace-content" tabIndex={-1} style={{ backgroundColor: WORKSPACE_BACKGROUNDS[workspaceTheme] }} className={`workspace-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${lightWorkspace ? "workspace-main--light text-slate-900" : "workspace-main--dark text-white"}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
