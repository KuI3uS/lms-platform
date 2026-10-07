import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
    BsArrowLeft,
    BsCheckCircleFill,
    BsClipboardCheck,
    BsCreditCard,
    BsHourglassSplit,
    BsLockFill,
    BsShieldCheck
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import { getCourseCover } from "../utils/courseCover";
import { resolveCoursePaymentUrl } from "../utils/paymentLinks";

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
    const [learningStats, setLearningStats] = useState(null);
    const [applyReward, setApplyReward] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const title = useMemo(
        () => course?.title || course?.name || "Kurs EduHub",
        [course]
    );
    const paymentUrl = useMemo(
        () => resolveCoursePaymentUrl(course, order),
        [course, order]
    );
    const availableReward = useMemo(() => {
        const balance = Number(learningStats?.discountBalance || 0);
        const courseLimit = Number(course?.price || 0) * 0.2;
        return Math.floor(Math.min(balance, courseLimit) / 50) * 50;
    }, [course, learningStats]);
    const previewDiscount = applyReward ? availableReward : 0;
    const amountDue = order?.amount ?? Math.max(
        0,
        Number(course?.price || 0) - previewDiscount
    );

    useEffect(() => {
        let active = true;

        Promise.all([
            apiFetch(`/courses/${courseId}`),
            apiFetch("/course-orders/my"),
            fetchLearningStats()
        ])
            .then(([courseData, orders, statsData]) => {
                if (!active) return;
                setCourse(courseData);
                setOrder((orders || []).find(
                    (item) => String(item.courseId) === String(courseId)
                        && item.status === "PENDING"
                ) || null);
                setLearningStats(statsData);
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
                method: "POST",
                body: JSON.stringify({
                    requestedDiscount: applyReward ? availableReward : 0
                })
            });
            setOrder(created);

            if (created.status === "PAID") {
                navigate(`/modules/${courseId}`, { replace: true });
                return;
            }
            const createdPaymentUrl = resolveCoursePaymentUrl(course, created);
            if (createdPaymentUrl) {
                window.open(createdPaymentUrl, "_blank", "noopener,noreferrer");
            }
        } catch (purchaseError) {
            setError(purchaseError.message || "Nie udało się utworzyć zamówienia.");
        } finally {
            setBusy(false);
        }
    };

    const copyPaymentLink = async () => {
        if (!paymentUrl) return;
        try {
            await navigator.clipboard.writeText(paymentUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Nie udało się skopiować linku. Otwórz płatność i skopiuj adres z przeglądarki.");
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
                    <p className="mt-2 text-4xl font-black text-white">{formatPrice(amountDue)}</p>
                    {Number(order?.discountAmount || previewDiscount) > 0 && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-sm">
                            <span className="text-slate-400">
                                Cena przed nagrodą: {formatPrice(order?.originalAmount ?? course?.price)}
                            </span>
                            <strong className="text-emerald-300">
                                −{formatPrice(order?.discountAmount ?? previewDiscount)}
                            </strong>
                        </div>
                    )}

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
                            {paymentUrl ? (
                                <>
                                    <div className="rounded-3xl border border-white/10 bg-white p-4">
                                        <QRCodeSVG
                                            value={paymentUrl}
                                            size={224}
                                            level="H"
                                            marginSize={2}
                                            title={`Płatność za kurs ${title}`}
                                            className="mx-auto h-auto w-full max-w-56"
                                        />
                                    </div>
                                    <p className="text-center text-sm leading-6 text-slate-400">
                                        Zeskanuj kod aparatem telefonu albo otwórz płatność w nowej karcie.
                                    </p>
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-4 font-black"
                                    >
                                        <BsCreditCard /> Otwórz płatność Revolut
                                    </a>
                                    <button
                                        type="button"
                                        onClick={copyPaymentLink}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                                    >
                                        <BsClipboardCheck />
                                        {copied ? "Link skopiowany" : "Skopiuj link do płatności"}
                                    </button>
                                </>
                            ) : (
                                Number(order.discountAmount || 0) > 0 ? (
                                    <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                                        Zniżka została zarezerwowana. Stały link Revolut ma zapisaną pełną cenę, dlatego nie otwieramy go, aby nie pobrać za dużo. Administrator potwierdzi płatność obniżonej kwoty: {formatPrice(order.amount)}.
                                    </p>
                                ) : (
                                    <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                                        Administrator nie skonfigurował jeszcze linku do płatności dla tego kursu.
                                    </p>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="mt-7 space-y-4">
                            {availableReward > 0 && (
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                    <input
                                        type="checkbox"
                                        checked={applyReward}
                                        onChange={(event) => setApplyReward(event.target.checked)}
                                        className="mt-1"
                                    />
                                    <span>
                                        <span className="block font-black text-emerald-200">
                                            Użyj {formatPrice(availableReward)} z portfela nagród
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-400">
                                            Limit bezpieczeństwa to 20% ceny kursu. Niewykorzystana kwota pozostanie na koncie.
                                        </span>
                                    </span>
                                </label>
                            )}
                            <button
                                type="button"
                                disabled={busy}
                                onClick={createOrder}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-4 font-black shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-60"
                            >
                                {busy
                                    ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    : <BsCreditCard />}
                                {busy ? "Tworzenie zamówienia..." : "Kup kurs"}
                            </button>
                        </div>
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
