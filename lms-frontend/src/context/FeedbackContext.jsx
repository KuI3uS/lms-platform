/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BsCheckCircleFill,
    BsExclamationTriangleFill,
    BsInfoCircleFill,
    BsX
} from "react-icons/bs";

const FeedbackContext = createContext(null);

const TOAST_STYLES = {
    success: { icon: <BsCheckCircleFill />, color: "text-emerald-300", border: "border-emerald-400/25" },
    error: { icon: <BsExclamationTriangleFill />, color: "text-red-300", border: "border-red-400/25" },
    warning: { icon: <BsExclamationTriangleFill />, color: "text-amber-300", border: "border-amber-400/25" },
    info: { icon: <BsInfoCircleFill />, color: "text-cyan-300", border: "border-cyan-400/25" }
};

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const sequence = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = "info", title = "") => {
        const id = ++sequence.current;
        setToasts((current) => [...current.slice(-3), { id, message, type, title }]);
        window.setTimeout(() => dismiss(id), type === "error" ? 6500 : 4500);
        return id;
    }, [dismiss]);

    const confirm = useCallback((options) => new Promise((resolve) => {
        const normalized = typeof options === "string"
            ? { message: options }
            : options;
        setDialog({
            title: normalized.title || "Potwierdź operację",
            message: normalized.message || "Czy chcesz kontynuować?",
            confirmLabel: normalized.confirmLabel || "Potwierdź",
            cancelLabel: normalized.cancelLabel || "Anuluj",
            danger: normalized.danger ?? true,
            resolve
        });
    }), []);

    const closeDialog = (answer) => {
        setDialog((current) => {
            current?.resolve(answer);
            return null;
        });
    };

    const value = useMemo(() => ({ showToast, confirm }), [confirm, showToast]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            {typeof document !== "undefined" && createPortal(
                <>
                    <div className="pointer-events-none fixed right-4 top-4 z-[10050] flex w-[min(25rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
                        {toasts.map((toast) => {
                            const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
                            return (
                                <article key={toast.id} className={`pointer-events-auto flex gap-3 rounded-2xl border ${style.border} bg-[#0b0f19]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl`}>
                                    <span className={`mt-0.5 text-xl ${style.color}`}>{style.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        {toast.title && <p className="font-black text-white">{toast.title}</p>}
                                        <p className="text-sm leading-6 text-slate-300">{toast.message}</p>
                                    </div>
                                    <button type="button" onClick={() => dismiss(toast.id)} aria-label="Zamknij powiadomienie" className="h-8 w-8 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"><BsX className="mx-auto" /></button>
                                </article>
                            );
                        })}
                    </div>

                    {dialog && (
                        <div className="fixed inset-0 z-[10060] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog(false)}>
                            <section role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title" className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0f19] p-6 shadow-2xl shadow-black/70">
                                <div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${dialog.danger ? "bg-red-500/10 text-red-300" : "bg-cyan-500/10 text-cyan-300"}`}><BsExclamationTriangleFill /></div>
                                <h2 id="feedback-dialog-title" className="mt-5 text-2xl font-black text-white">{dialog.title}</h2>
                                <p className="mt-3 leading-7 text-slate-400">{dialog.message}</p>
                                <div className="mt-7 flex justify-end gap-3">
                                    <button type="button" onClick={() => closeDialog(false)} className="rounded-xl border border-white/10 px-5 py-3 font-black text-slate-300 hover:bg-white/5">{dialog.cancelLabel}</button>
                                    <button type="button" autoFocus onClick={() => closeDialog(true)} className={`rounded-xl px-5 py-3 font-black text-white ${dialog.danger ? "bg-red-600 hover:bg-red-500" : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"}`}>{dialog.confirmLabel}</button>
                                </div>
                            </section>
                        </div>
                    )}
                </>,
                document.body
            )}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) throw new Error("useFeedback wymaga FeedbackProvider");
    return context;
}
