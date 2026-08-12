import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsAwardFill,
    BsBarChartFill,
    BsBookHalf,
    BsCheckCircleFill,
    BsClockHistory,
    BsFire,
    BsGem,
    BsGraphUpArrow,
    BsLightningChargeFill,
    BsLockFill,
    BsPrinterFill,
    BsTrophyFill,
    BsTranslate
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import LeagueBadge from "../components/LeagueBadge";
import { getCourseLanguageLabel } from "../utils/courseTaxonomy";

const ANALYTICS_CACHE_TTL = 5 * 60_000;
const ANALYTICS_STORAGE_PREFIX = "eduhub-learning-analytics";
const analyticsCache = new Map();

function analyticsCacheKey() {
    try {
        const token = localStorage.getItem("token");
        const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
        return `${ANALYTICS_STORAGE_PREFIX}:${payload.sub || payload.email || "anonymous"}`;
    } catch {
        return `${ANALYTICS_STORAGE_PREFIX}:anonymous`;
    }
}

function getCachedAnalytics() {
    const cached = analyticsCache.get(analyticsCacheKey());
    if (cached && Date.now() - cached.savedAt < ANALYTICS_CACHE_TTL) {
        return cached.value;
    }
    try {
        const stored = JSON.parse(sessionStorage.getItem(analyticsCacheKey()));
        if (stored && Date.now() - stored.savedAt < ANALYTICS_CACHE_TTL) {
            analyticsCache.set(analyticsCacheKey(), stored);
            return stored.value;
        }
    } catch {
        // Brak pamięci sesji nie blokuje statystyk.
    }
    return null;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes} min`;
    return `${hours} godz. ${minutes} min`;
}

const achievementIcons = {
    fire: <BsFire />,
    lightning: <BsLightningChargeFill />,
    trophy: <BsTrophyFill />,
    certificate: <BsAwardFill />,
    book: <BsBookHalf />,
    calendar: <BsClockHistory />,
    layers: <BsBarChartFill />,
    stars: <BsGraphUpArrow />
};

export default function LearningCenterPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(getCachedAnalytics);
    const [stats, setStats] = useState(null);
    const [rewards, setRewards] = useState(null);
    const [loading, setLoading] = useState(() => !getCachedAnalytics());
    const [error, setError] = useState("");
    const [rewardMessage, setRewardMessage] = useState("");
    const [rewardBusy, setRewardBusy] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/learning/analytics")
            .then((analyticsResponse) => {
                if (!active) return;
                const cacheEntry = {
                    value: analyticsResponse,
                    savedAt: Date.now()
                };
                analyticsCache.set(analyticsCacheKey(), cacheEntry);
                try {
                    sessionStorage.setItem(analyticsCacheKey(), JSON.stringify(cacheEntry));
                } catch {
                    // Dane nadal pozostają w pamięci bieżącej strony.
                }
                setData(analyticsResponse);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać statystyk.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        fetchLearningStats()
            .then((statsResponse) => {
                if (active) setStats(statsResponse);
            })
            .catch(() => {
                // Główne statystyki nadal mogą zostać wyświetlone.
            });
        apiFetch("/rewards")
            .then((rewardResponse) => {
                if (active) setRewards(rewardResponse);
            })
            .catch(() => {
                // Sklep nie blokuje analityki nauki.
            });
        return () => {
            active = false;
        };
    }, []);

    const maxActivity = useMemo(
        () => Math.max(1, ...(data?.recentActivity || []).map((item) => item.seconds)),
        [data]
    );

    const updateRewardCenter = async (path, successMessage) => {
        try {
            setRewardBusy(path);
            setRewardMessage("");
            const updated = await apiFetch(path, { method: "POST" });
            setRewards(updated);
            setRewardMessage(successMessage);
            const refreshedStats = await fetchLearningStats({ force: true });
            setStats(refreshedStats);
            window.dispatchEvent(new Event("eduhub:stats-changed"));
        } catch (requestError) {
            setRewardMessage(requestError.message || "Nie udało się wykonać tej operacji.");
        } finally {
            setRewardBusy("");
        }
    };

    const purchaseReward = (item) => updateRewardCenter(
        `/rewards/purchase/${item.code}`,
        item.type === "DISCOUNT"
            ? `Kupon ${item.discountPercent}% trafił do Twojego portfela.`
            : `Aktywowano ${item.title}.`
    );

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-200">
                {error || "Nie udało się pobrać centrum nauki."}
            </div>
        );
    }

    return (
        <div className="space-y-10 text-white">
            <section className="relative overflow-hidden rounded-[38px] border border-cyan-400/15 bg-[#080d19] p-7 sm:p-10">
                <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Twój profil rozwoju</p>
                            {stats?.leagueName && (
                                <span
                                    className="rounded-full border px-3 py-1 text-xs font-black"
                                    style={{ borderColor: `${stats.leagueColor}55`, color: stats.leagueColor, backgroundColor: `${stats.leagueColor}12` }}
                                >
                                    Liga {stats.leagueName}
                                </span>
                            )}
                        </div>
                        <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">Uczysz się. Awansujesz. Tworzysz.</h1>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                            Klejnoty zdobywasz wyłącznie za realne ukończenie lekcji. Wymieniaj je na boostery XP i kupony na kursy.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-black text-cyan-100">
                                <BsGem /> {Number(stats?.gemBalance || rewards?.gemBalance || 0).toLocaleString("pl-PL")} klejnotów
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 font-black text-violet-100">
                                <BsLightningChargeFill /> Poziom {stats?.level || 1}
                            </span>
                        </div>
                    </div>
                    <div className="relative mx-auto flex min-h-[260px] w-full max-w-[280px] flex-col items-center justify-center overflow-hidden rounded-[40px] border border-white/10 bg-black/20 p-7">
                        <div className="absolute inset-10 rounded-full bg-orange-400/10 blur-3xl" />
                        <LeagueBadge name={stats?.leagueName || "Miedź"} size="xl" className="relative" />
                        <p className="relative mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Aktualna liga</p>
                        <p className="relative mt-1 text-xl font-black">{stats?.leagueName || "Miedź"}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={<BsClockHistory />} label="Czas nauki" value={formatDuration(data.totalStudySeconds)} color="cyan" />
                <Stat icon={<BsCheckCircleFill />} label="Ukończone lekcje" value={data.completedLessons} color="green" />
                <Stat icon={<BsGraphUpArrow />} label="Skuteczność zadań" value={`${data.taskAccuracy}%`} color="violet" />
                <Stat icon={<BsTrophyFill />} label="Średnia egzaminów" value={`${data.examAverage}%`} color="amber" />
            </div>

            {stats && (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/[0.08] p-6">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-300">Poziom {stats.level}</p>
                        <p className="mt-3 text-3xl font-black">{stats.xp} XP</p>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/30">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                style={{
                                    width: `${Math.min(100, stats.xpIntoLevel * 100 / Math.max(1, stats.xpForNextLevel))}%`
                                }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                            {stats.xpIntoLevel} / {stats.xpForNextLevel} XP do kolejnego poziomu
                        </p>
                    </div>

                    <div className="rounded-3xl border border-orange-400/20 bg-orange-500/[0.08] p-6">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-300">Seria zadań</p>
                        <div className="mt-3 flex items-end justify-between gap-4">
                            <p className="text-3xl font-black">{stats.taskStreak}</p>
                            <p className="rounded-full bg-orange-500/15 px-3 py-1 font-black text-orange-200">
                                x{stats.xpMultiplier} XP
                            </p>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                            5 poprawnych zadań uruchamia x2, a 10 poprawnych x3. Seria wygasa 24 godziny po ostatnim poprawnym zadaniu.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/[0.08] p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Klejnoty</p>
                                <p className="mt-3 text-3xl font-black">{Number(stats.gemBalance || 0).toLocaleString("pl-PL")}</p>
                            </div>
                            <BsGem className="text-3xl text-cyan-300" />
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                            +50 za pierwsze ukończenie lekcji. Kolejne +{stats.nextGemRewardAmount} na poziomie {stats.nextGemRewardLevel}.
                        </p>
                    </div>

                    <div className="rounded-3xl border p-6" style={{ borderColor: `${stats.leagueColor}33`, backgroundColor: `${stats.leagueColor}0d` }}>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: stats.leagueColor }}>Liga pierwiastków</p>
                        <div className="mt-3 flex items-center gap-3">
                            <LeagueBadge name={stats.leagueName} size="sm" />
                            <p className="text-3xl font-black">{stats.leagueName}</p>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                            {stats.nextLeagueLevel
                                ? `Następna odznaka ligi od poziomu ${stats.nextLeagueLevel}.`
                                : "Najwyższa liga i najrzadsza odznaka Pryzmatu."}
                        </p>
                    </div>
                </section>
            )}

            {rewards && (
                <RewardShop
                    rewards={rewards}
                    busy={rewardBusy}
                    message={rewardMessage}
                    onPurchase={purchaseReward}
                />
            )}

            <div className="grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Aktywność</p>
                            <h2 className="mt-2 text-2xl font-black">Ostatnie dni nauki</h2>
                        </div>
                        <BsBarChartFill className="text-2xl text-cyan-300" />
                    </div>
                    {data.recentActivity.length === 0 ? (
                        <p className="mt-8 text-slate-500">Czas zacznie naliczać się podczas korzystania z platformy.</p>
                    ) : (
                        <div className="mt-8 flex h-52 items-end gap-2">
                            {data.recentActivity.map((item) => (
                                <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                    <div className="flex h-40 w-full items-end rounded-xl bg-black/20 p-1">
                                        <div
                                            className="w-full rounded-lg bg-gradient-to-t from-cyan-500 to-blue-500"
                                            style={{ height: `${Math.max(6, item.seconds * 100 / maxActivity)}%` }}
                                            title={formatDuration(item.seconds)}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-600">{item.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                    <p className="text-xs font-black uppercase tracking-widest text-red-300">Do poprawy</p>
                    <h2 className="mt-2 text-2xl font-black">Najtrudniejsze zadania</h2>
                    {data.hardestTasks.length === 0 ? (
                        <p className="mt-8 text-slate-500">Rozwiąż pierwsze zadania, aby zobaczyć analizę.</p>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {data.hardestTasks.map((task, index) => (
                                <div key={task.blockId} className="flex items-center gap-4 rounded-2xl bg-black/20 p-4">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 font-black text-red-300">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-black">{task.title}</p>
                                        <p className="truncate text-xs text-slate-500">{task.lessonTitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black">{task.attemptCount}</p>
                                        <p className="text-[10px] uppercase text-slate-600">prób</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section>
                <div className="flex items-end justify-between gap-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-violet-300">Motywacja</p>
                        <h2 className="mt-2 text-3xl font-black">Osiągnięcia</h2>
                    </div>
                    <p className="text-sm text-slate-500">
                        {data.achievements.filter((item) => item.unlocked).length}/{data.achievements.length}
                    </p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.achievements.map((achievement) => (
                        <article
                            key={achievement.type}
                            className={`rounded-3xl border p-5 transition ${
                                achievement.unlocked
                                    ? "border-violet-400/30 bg-violet-500/10"
                                    : "border-white/5 bg-white/[0.025] opacity-55"
                            }`}
                        >
                            <div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${
                                achievement.unlocked
                                    ? "bg-violet-500/20 text-violet-200"
                                    : "bg-slate-900 text-slate-600"
                            }`}>
                                {achievement.unlocked
                                    ? achievementIcons[achievement.icon] || <BsAwardFill />
                                    : <BsLockFill />}
                            </div>
                            <h3 className="mt-4 font-black">{achievement.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{achievement.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section>
                <p className="text-xs font-black uppercase tracking-widest text-amber-300">Dokumenty</p>
                <h2 className="mt-2 text-3xl font-black">Certyfikaty ukończenia</h2>
                {data.certificates.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center">
                        <BsAwardFill className="mx-auto text-5xl text-slate-700" />
                        <p className="mt-4 text-slate-500">
                            Certyfikat pojawi się automatycznie po ukończeniu wszystkich lekcji kursu.
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        {data.certificates.map((certificate) => (
                            <article key={certificate.certificateNumber} className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-white/[0.03] p-6">
                                <div className="flex items-start gap-5">
                                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-2xl text-amber-300">
                                        <BsAwardFill />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-300">Certyfikat EduHub</p>
                                        <h3 className="mt-2 text-xl font-black">{certificate.courseTitle}</h3>
                                        {certificate.category === "LANGUAGE" && (
                                            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                                                <BsTranslate />
                                                {getCourseLanguageLabel(certificate.courseLanguage)} · CEFR {certificate.cefrLevel}
                                            </p>
                                        )}
                                        <p className="mt-2 break-all font-mono text-xs text-slate-500">{certificate.certificateNumber}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/certificates/${certificate.certificateNumber}`)}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 font-black text-amber-100"
                                >
                                    <BsPrinterFill /> Otwórz i pobierz
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function Stat({ icon, label, value, color }) {
    const colors = {
        cyan: "bg-cyan-500/10 text-cyan-300",
        green: "bg-emerald-500/10 text-emerald-300",
        violet: "bg-violet-500/10 text-violet-300",
        amber: "bg-amber-500/10 text-amber-300"
    };
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${colors[color]}`}>{icon}</div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-black">{value}</p>
        </div>
    );
}

function RewardShop({ rewards, busy, message, onPurchase }) {
    const groups = [
        { type: "DISCOUNT", title: "Kupony na kursy", description: "Jednorazowe zniżki kupowane za konsekwentną naukę." },
        { type: "BOOSTER", title: "Boostery XP", description: "Przyspieszają rozwój poziomu, ale nie zwiększają liczby klejnotów." }
    ];

    return (
        <section className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.025]">
            <div className="grid gap-6 border-b border-white/[0.08] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Skarbiec EduHub</p>
                    <h2 className="mt-3 text-3xl font-black sm:text-4xl">Nagrody za wykonaną pracę</h2>
                    <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                        Liczy się ukończona lekcja, nie czas spędzony na stronie. Kupon 5% wymaga 2500 klejnotów, czyli 50 pełnych lekcji — około 25 godzin aktywnej pracy przy średnio 30 minutach na lekcję.
                    </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Dostępne</p>
                    <p className="mt-1 flex items-center justify-end gap-2 text-3xl font-black"><BsGem /> {Number(rewards.gemBalance).toLocaleString("pl-PL")}</p>
                </div>
            </div>

            {message && (
                <div className="mx-6 mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-3 text-sm font-bold text-cyan-100 sm:mx-8">
                    {message}
                </div>
            )}

            <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-violet-300">Aktywny booster</p>
                    <p className="mt-2 text-2xl font-black">{rewards.xpBoostPercent > 0 ? `+${rewards.xpBoostPercent}% XP` : "Brak"}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        {rewards.xpBoostExpiresAt
                            ? `Działa do ${new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(rewards.xpBoostExpiresAt))}`
                            : "Booster możesz aktywować w dowolnym momencie."}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Portfel kuponów</p>
                    <div className="mt-4 flex gap-2">
                        {[5, 10, 20].map((percent) => (
                            <span key={percent} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2 text-sm font-black text-emerald-100">
                                {percent}% × {rewards.vouchers[`discount${percent}`]}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-300">Premia ligowa</p>
                    <p className="mt-2 text-2xl font-black">+{rewards.nextGemRewardAmount} klejnotów</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Na poziomie {rewards.nextGemRewardLevel}. Premia wpada co 5 poziomów.</p>
                </div>
            </div>

            <LeagueRoadmap currentLeague={rewards.league.name} />

            <div className="space-y-10 border-t border-white/[0.08] p-6 sm:p-8">
                {groups.map((group) => {
                    const items = rewards.catalog.filter((item) => item.type === group.type);
                    return (
                        <div key={group.type}>
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-black">{group.title}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((item) => (
                                    <RewardCard
                                        key={item.code}
                                        item={item}
                                        gemBalance={rewards.gemBalance}
                                        busy={busy}
                                        onPurchase={onPurchase}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function LeagueRoadmap({ currentLeague }) {
    const leagues = [
        { name: "Miedź", level: "1–4", color: "#fb923c" },
        { name: "Srebro", level: "5–9", color: "#e2e8f0" },
        { name: "Złoto", level: "10–14", color: "#facc15" },
        { name: "Platyna", level: "15–24", color: "#22d3ee" },
        { name: "Kryształ", level: "25–39", color: "#a78bfa" },
        { name: "Diament", level: "40–59", color: "#38bdf8" },
        { name: "Pryzmat", level: "60+", color: "#f472b6" }
    ];

    return (
        <div className="border-t border-white/[0.08] px-6 py-7 sm:px-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Droga lig</p>
                    <h3 className="mt-2 text-xl font-black">Każdy próg ma własną, coraz rzadszą odznakę</h3>
                </div>
            </div>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {leagues.map((league) => {
                    const active = currentLeague === league.name;
                    return (
                        <div key={league.name} className={`min-w-[132px] rounded-2xl border p-4 ${active ? "bg-white/[0.08]" : "bg-black/15 opacity-65"}`} style={{ borderColor: `${league.color}${active ? "77" : "22"}`, boxShadow: active ? `0 0 24px ${league.color}22` : "none" }}>
                            <LeagueBadge name={league.name} size="md" muted={!active} />
                            <p className="mt-3 text-sm font-black" style={{ color: active ? league.color : undefined }}>{league.name}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Poziom {league.level}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RewardCard({ item, gemBalance, busy, onPurchase }) {
    const canAfford = Number(gemBalance) >= item.cost;
    const disabled = Boolean(busy) || !item.available || !canAfford;
    const label = !item.available
        ? `Poziom ${item.requiredLevel}`
        : !canAfford
            ? "Za mało klejnotów"
            : "Kup";

    return (
        <article className="group rounded-3xl border border-white/[0.08] bg-black/20 p-5 transition hover:-translate-y-1 hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${item.type === "DISCOUNT" ? "bg-emerald-400/10 text-emerald-300" : "bg-violet-400/10 text-violet-300"}`}>
                    {item.type === "DISCOUNT" ? `${item.discountPercent}%` : <BsLightningChargeFill />}
                </span>
                {item.quantity > 0 && <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-black text-emerald-300">Masz {item.quantity}</span>}
            </div>
            <h4 className="mt-4 text-lg font-black">{item.title}</h4>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{item.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm font-black text-cyan-200"><BsGem /> {item.cost.toLocaleString("pl-PL")}</span>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPurchase(item)}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-600"
                >
                    {busy === `/rewards/purchase/${item.code}` ? "Chwila…" : label}
                </button>
            </div>
        </article>
    );
}
