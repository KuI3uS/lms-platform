import { useEffect, useMemo, useState } from "react";
import {
    BsBarChartFill,
    BsBook,
    BsCashCoin,
    BsCheckCircle,
    BsClockHistory,
    BsPeople
} from "react-icons/bs";
import { apiFetch } from "../api/api";

function formatMoney(value) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN"
    }).format(value || 0);
}

export default function AdminStatisticsPage() {
    const [data, setData] = useState({
        users: [],
        courses: [],
        orders: [],
        tutoring: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([
            apiFetch("/users"),
            apiFetch("/courses"),
            apiFetch("/course-orders/admin"),
            apiFetch("/tutoring/all")
        ])
            .then(([users, courses, orders, tutoring]) => {
                if (!active) return;
                setData({
                    users: users || [],
                    courses: courses || [],
                    orders: orders || [],
                    tutoring: tutoring || []
                });
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać statystyk.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const stats = useMemo(() => {
        const paidOrders = data.orders.filter((order) => order.status === "PAID");
        return {
            students: data.users.filter((user) => user.role === "STUDENT").length,
            publishedCourses: data.courses.filter((course) => course.published).length,
            paidOrders: paidOrders.length,
            pendingOrders: data.orders.filter((order) => order.status === "PENDING").length,
            revenue: paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
            tutoring: data.tutoring.length
        };
    }, [data]);

    if (loading) {
        return (
            <div className="grid min-h-[55vh] place-items-center">
                <span className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
        );
    }

    const cards = [
        { label: "Uczniowie", value: stats.students, icon: <BsPeople />, color: "text-blue-300 bg-blue-500/15" },
        { label: "Opublikowane kursy", value: stats.publishedCourses, icon: <BsBook />, color: "text-violet-300 bg-violet-500/15" },
        { label: "Opłacone zamówienia", value: stats.paidOrders, icon: <BsCheckCircle />, color: "text-emerald-300 bg-emerald-500/15" },
        { label: "Oczekujące płatności", value: stats.pendingOrders, icon: <BsClockHistory />, color: "text-amber-300 bg-amber-500/15" },
        { label: "Wartość sprzedaży", value: formatMoney(stats.revenue), icon: <BsCashCoin />, color: "text-orange-300 bg-orange-500/15" },
        { label: "Rezerwacje korepetycji", value: stats.tutoring, icon: <BsBarChartFill />, color: "text-cyan-300 bg-cyan-500/15" }
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8 text-white">
            <header className="rounded-[34px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/70 to-slate-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">EduHub Analytics</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Statystyki platformy</h1>
                <p className="mt-4 text-slate-400">Aktualny obraz użytkowników, oferty i sprzedaży kursów.</p>
            </header>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <article key={card.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                        <div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${card.color}`}>
                            {card.icon}
                        </div>
                        <p className="mt-5 text-sm font-bold text-slate-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-black">{card.value}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <h2 className="text-2xl font-black">Kursy</h2>
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
                        <thead className="text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="pb-3">Nazwa</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Moduły</th>
                                <th className="pb-3">Lekcje</th>
                                <th className="pb-3 text-right">Cena</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.courses.map((course) => (
                                <tr key={course.id}>
                                    <td className="py-4 font-black">{course.title || course.name}</td>
                                    <td className="py-4 text-sm text-slate-400">
                                        {course.published ? "Opublikowany" : "Szkic"}
                                    </td>
                                    <td className="py-4">{course.moduleCount}</td>
                                    <td className="py-4">{course.lessonCount}</td>
                                    <td className="py-4 text-right font-bold">{formatMoney(course.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
