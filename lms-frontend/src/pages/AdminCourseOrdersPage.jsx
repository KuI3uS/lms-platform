import { useEffect, useState } from "react";
import {
    BsCheckCircleFill,
    BsClockHistory,
    BsCreditCard,
    BsXCircle
} from "react-icons/bs";
import { apiFetch } from "../api/api";

function formatPrice(value) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN"
    }).format(Number(value || 0));
}

export default function AdminCourseOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/course-orders/admin")
            .then((data) => {
                if (active) setOrders(data || []);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać zamówień.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const update = async (orderId, action) => {
        try {
            setBusyId(orderId);
            setError("");
            const updated = await apiFetch(`/course-orders/${orderId}/${action}`, {
                method: "PUT"
            });
            setOrders((current) => current.map(
                (order) => order.id === orderId ? updated : order
            ));
        } catch (updateError) {
            setError(updateError.message || "Nie udało się zmienić zamówienia.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8 text-white">
            <section className="rounded-[36px] border border-blue-500/20 bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Administracja</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Zamówienia kursów</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Potwierdzenie płatności automatycznie tworzy aktywny dostęp do kursu i wysyła powiadomienie uczniowi.
                </p>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex min-h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-500">
                    Brak zamówień kursów.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <article key={order.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                                    order.status === "PAID"
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : order.status === "CANCELLED"
                                            ? "bg-red-500/15 text-red-300"
                                            : "bg-amber-500/15 text-amber-300"
                                }`}>
                                    {order.status === "PAID"
                                        ? <BsCheckCircleFill />
                                        : order.status === "CANCELLED"
                                            ? <BsXCircle />
                                            : <BsClockHistory />}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-xl font-black">{order.courseTitle}</h2>
                                    <p className="mt-1 break-all text-sm text-slate-400">{order.userEmail}</p>
                                    <p className="mt-2 font-mono text-xs text-cyan-300">{order.reference}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-600">Kwota</p>
                                        <p className="mt-1 font-black">{formatPrice(order.amount)}</p>
                                        {Number(order.discountAmount || 0) > 0 && (
                                            <p className="mt-1 text-xs font-bold text-emerald-300">
                                                Zniżka: −{formatPrice(order.discountAmount)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-600">Status</p>
                                        <p className="mt-1 font-black">{order.status}</p>
                                    </div>
                                </div>

                                {order.status === "PENDING" && (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={busyId === order.id}
                                            onClick={() => update(order.id, "confirm")}
                                            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-black text-emerald-950 disabled:opacity-50"
                                        >
                                            <BsCreditCard /> Potwierdź
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busyId === order.id}
                                            onClick={() => update(order.id, "cancel")}
                                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-black text-red-200 disabled:opacity-50"
                                        >
                                            Anuluj
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
