import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BsArrowLeft,
    BsCheckCircleFill,
    BsCreditCard,
    BsHourglassSplit,
    BsLockFill,
    BsShieldCheck
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseCover } from "../utils/courseCover";

function formatPrice(value) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN"
    }).format(Number(value || 0));
}

export default function CourseCheckoutPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const title = useMemo(
        () => course?.title || course?.name || "Kurs EduHub",
        [course]
    );

    useEffect(() => {
        let active = true;

        Promise.all([
            apiFetch(`/courses/${courseId}`),
            apiFetch("/course-orders/my")
        ])
            .then(([courseData, orders]) => {
                if (!active) return;
                setCourse(courseData);
                setOrder((orders || []).find(
                    (item) => String(item.courseId) === String(courseId)
                        && item.status === "PENDING"
                ) || null);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać zamówienia.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!order || order.status !== "PENDING") return undefined;

        const timer = window.setInterval(() => {
            apiFetch("/course-orders/my")
                .then((orders) => {
                    const current = (orders || []).find((item) => item.id === order.id);
                    if (!current) return;
                    setOrder(current);
                    if (current.status === "PAID") {
                        setCourse((value) => value ? { ...value, canAccess: true } : value);
                    }
                })
                .catch(() => {});
        }, 10000);

        return () => window.clearInterval(timer);
    }, [order]);

    const createOrder = async () => {
        try {
            setBusy(true);
            setError("");
            const created = await apiFetch(`/course-orders/course/${courseId}`, {
                method: "POST"
            });
            setOrder(created);

            if (created.status === "PAID") {
                navigate(`/modules/${courseId}`, { replace: true });
                return;
            }
            if (created.paymentUrl) {
                window.open(created.paymentUrl, "_blank", "noopener,noreferrer");
            }
        } catch (purchaseError) {
            setError(purchaseError.message || "Nie udało się utworzyć zamówienia.");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-7 text-white">
            <button
                type="button"
                onClick={() => navigate("/courses")}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
                <BsArrowLeft /> Wróć do katalogu
            </button>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04]">
                    <div className="relative">
                        <img
                            src={getCourseCover(course || {})}
                            alt={`Okładka kursu ${title}`}
                            className="aspect-[16/7] w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-7 sm:p-10">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">EduHub • bezpieczny dostęp</p>
                            <h1 className="mt-3 text-3xl font-black sm:text-5xl">{title}</h1>
                        </div>
                    </div>

                    <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
                        <Info icon={<BsLockFill />} title="Dostęp na stałe" text="Kurs pojawi się w sekcji Moje kursy." />
                        <Info icon={<BsShieldCheck />} title="Bezpieczna aktywacja" text="Dostęp nadaje backend po potwierdzeniu." />
                        <Info icon={<BsCheckCircleFill />} title="Pełna zawartość" text="Lekcje, egzaminy i certyfikat." />
                    </div>
                </section>

                <aside className="h-fit rounded-[30px] border border-cyan-500/20 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 sm:p-7">
                    <p className="text-sm font-bold text-slate-400">Do zapłaty</p>
                    <p className="mt-2 text-4xl font-black text-white">{formatPrice(course?.price)}</p>

                    {course?.canAccess || order?.status === "PAID" ? (
                        <div className="mt-7">
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                                <div className="flex items-center gap-3 font-black">
                                    <BsCheckCircleFill /> Dostęp aktywny
                                </div>
                                <p className="mt-2 text-sm text-emerald-100/70">
                                    Kurs znajduje się już w Twojej bibliotece.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate(`/modules/${courseId}`)}
                                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-black"
                            >
                                Przejdź do kursu
                            </button>
                        </div>
                    ) : order?.status === "PENDING" ? (
                        <div className="mt-7 space-y-4">
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                                <div className="flex items-center gap-3 font-black">
                                    <BsHourglassSplit /> Oczekuje na potwierdzenie
                                </div>
                                <p className="mt-2 text-sm text-amber-100/70">
                                    Po płatności administrator potwierdzi zamówienie, a dostęp włączy się automatycznie.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-black/25 p-4">
                                <p className="text-xs uppercase tracking-wider text-slate-500">Numer zamówienia</p>
                                <p className="mt-1 break-all font-mono font-bold text-cyan-300">{order.reference}</p>
                            </div>
                            {order.paymentUrl ? (
                                <a
                                    href={order.paymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-4 font-black"
                                >
                                    <BsCreditCard /> Otwórz płatność
                                </a>
                            ) : (
                                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                                    Administrator nie skonfigurował jeszcze linku do płatności dla tego kursu.
                                </p>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={createOrder}
                            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-4 font-black shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-60"
                        >
                            {busy
                                ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                : <BsCreditCard />}
                            {busy ? "Tworzenie zamówienia..." : "Kup kurs"}
                        </button>
                    )}

                    <p className="mt-5 text-xs leading-5 text-slate-500">
                        Dostęp nie jest aktywowany przez sam frontend. Status płatności i uprawnienie do kursu są przechowywane w backendzie.
                    </p>
                </aside>
            </div>
        </div>
    );
}

function Info({ icon, title, text }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <div className="text-xl text-cyan-300">{icon}</div>
            <p className="mt-3 font-black">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
        </div>
    );
}
