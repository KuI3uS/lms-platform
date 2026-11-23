import { useLocale } from "../context/LocaleContext";
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
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import LeagueBadge from "../components/LeagueBadge";
import { getCourseLanguageLabel } from "../utils/courseTaxonomy";

const ANALYTICS_CACHE_TTL = 5 * 60_000;
const ANALYTICS_STORAGE_PREFIX = "eduhub-learning-analytics";
const analyticsCache = new Map();

function analyticsCacheKey() {
    return `${ANALYTICS_STORAGE_PREFIX}:session`;
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

function formatDuration(seconds, t) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes} min`;
    return t("{value1} godz. {value2} min", { value1: hours, value2: minutes });
}

const achievementIcons = {
    fire: <BsFire />,
    lightning: <BsLightningChargeFill />,
    trophy: <BsTrophyFill />,
    certificate: <BsAwardFill />,
    book: <BsBookHalf />,
    calendar: <BsClockHistory />,
    layers: <BsBarChartFill />,
    stars: <BsGraphUpArrow />,
    check: <BsCheckCircleFill />,
    bolt: <BsLightningChargeFill />,
    level: <BsGraphUpArrow />,
    gem: <BsGem />,
    clock: <BsClockHistory />
};

const ACHIEVEMENT_GROUPS = [
    { key: "lessons", title: "Lekcje i rozwój", match: (type) => type === "FIRST_LESSON" || type.startsWith("LESSONS_") },
    { key: "rhythm", title: "Regularność", match: (type) => type.startsWith("STREAK_") || type.startsWith("STUDY_") },
    { key: "practice", title: "Praktyka i doświadczenie", match: (type) => type.startsWith("TASKS_") || type.startsWith("COMBO_") || type.startsWith("XP_") },
    { key: "mastery", title: "Mistrzostwo", match: () => true }
];

function achievementProgress(achievement, t, dateLocale) {
    const current = Number(achievement.progressCurrent || 0);
    const target = Math.max(1, Number(achievement.progressTarget || 1));
    const isTime = achievement.type.startsWith("STUDY_");
    return {
        percent: Math.min(100, current * 100 / target),
        label: isTime
            ? `${formatDuration(current, t)} / ${formatDuration(target, t)}`
            : `${current.toLocaleString(dateLocale)} / ${target.toLocaleString(dateLocale)}`
    };
}

export default function LearningCenterPage() {
    const { t, dateLocale } = useLocale();
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
                fetchLearningStats({ force: true })
                    .then((statsResponse) => {
                        if (active) setStats(statsResponse);
                    })
                    .catch(() => {});
                apiFetch("/rewards")
                    .then((rewardResponse) => {
                        if (active) setRewards(rewardResponse);
                    })
                    .catch(() => {});
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
            setRewardMessage(requestError.message || t("Nie udało się wykonać tej operacji."));
        } finally {
            setRewardBusy("");
        }
    };

    const purchaseReward = (item) => updateRewardCenter(
        `/rewards/purchase/${item.code}`,
        item.type === "DISCOUNT"
            ? t("Kupon {value1}% trafił do Twojego portfela.", { value1: item.discountPercent })
            : t("Aktywowano {value1}.", { value1: item.title })
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
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-800">
                {t(error || "Nie udało się pobrać centrum nauki.")}
            </div>
        );
    }

    return (
        <div className="product-page product-analytics space-y-7">
            <WorkspacePageHeader title={t("Postęp i nagrody")} description={t("Twoja aktywność, osiągnięcia i certyfikaty. Wszystko, co wypracowano podczas nauki.")} actions={stats && <span className="product-status product-status-positive">{t("Poziom")} {stats.level || 1} · {stats.xp || 0} XP</span>} />

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Stat icon={<BsClockHistory />} label={t("Czas nauki")} value={formatDuration(data.totalStudySeconds, t)} color="cyan" />
                <Stat icon={<BsCheckCircleFill />} label={t("Ukończone lekcje")} value={data.completedLessons} color="green" />
                <Stat icon={<BsGraphUpArrow />} label={t("Skuteczność zadań")} value={`${data.taskAccuracy}%`} color="violet" />
                <Stat icon={<BsTrophyFill />} label={t("Średnia egzaminów")} value={`${data.examAverage}%`} color="amber" />
            </div>

            {stats && (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/[0.08] p-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{t("Poziom")}{" "}{stats.level}</p>
                        <p className="mt-3 text-2xl font-semibold">{stats.xp}{" "}{t("XP")}</p>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-teal-600"
                                style={{
                                    width: `${Math.min(100, stats.xpIntoLevel * 100 / Math.max(1, stats.xpForNextLevel))}%`
                                }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                            {stats.xpIntoLevel} / {stats.xpForNextLevel}{" "}{t("XP do kolejnego poziomu")}</p>
                        {stats.xpBoostPercent > 0 && (
                            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-800">
                                <BsLightningChargeFill /> +{stats.xpBoostPercent}{t("% XP aktywne")}</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-orange-400/20 bg-orange-500/[0.08] p-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">{t("Seria zadań")}</p>
                        <div className="mt-3 flex items-end justify-between gap-4">
                            <p className="text-2xl font-semibold">{stats.taskStreak}</p>
                            <p className="rounded-full bg-orange-500/15 px-3 py-1 font-semibold text-orange-800">{t("x")}{stats.xpMultiplier}{" "}{t("XP")}</p>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{t("5 poprawnych zadań uruchamia x2, a 10 poprawnych x3. Licznik zeruje się dokładnie o północy czasu polskiego.")}</p>
                    </div>

                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t("Klejnoty")}</p>
                                <p className="mt-3 text-2xl font-semibold">{Number(stats.gemBalance || 0).toLocaleString(dateLocale)}</p>
                            </div>
                            <BsGem className="text-3xl text-teal-700" />
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{t("+50 za pierwsze ukończenie lekcji. Kolejne +")}{stats.nextGemRewardAmount}{" "}{t("na poziomie")}{" "}{stats.nextGemRewardLevel}.
                        </p>
                    </div>

                    <div className="rounded-xl border p-6" style={{ borderColor: `${stats.leagueColor}33`, backgroundColor: `${stats.leagueColor}0d` }}>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#506575" }}>{t("Liga pierwiastków")}</p>
                        <div className="mt-3 flex items-center gap-3">
                            <LeagueBadge name={stats.leagueName} size="sm" />
                            <p className="text-2xl font-semibold">{stats.leagueName}</p>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            {stats.nextLeagueLevel
                                ? t("Następna odznaka ligi od poziomu {value1}.", { value1: stats.nextLeagueLevel })
                                : t("Najwyższa, najrzadsza liga Mityczna.")}
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
                <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t("Aktywność")}</p>
                            <h2 className="mt-2 text-2xl font-semibold">{t("Ostatnie dni nauki")}</h2>
                        </div>
                        <BsBarChartFill className="text-2xl text-teal-700" />
                    </div>
                    {data.recentActivity.length === 0 ? (
                        <p className="mt-8 text-slate-500">{t("Czas zacznie naliczać się podczas korzystania z platformy.")}</p>
                    ) : (
                        <div className="mt-8 flex h-52 items-end gap-2">
                            {data.recentActivity.map((item) => (
                                <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                    <div className="flex h-40 w-full items-end rounded-xl bg-slate-50 p-1">
                                        <div
                                            className="w-full rounded-lg bg-teal-600"
                                            style={{ height: `${Math.max(6, item.seconds * 100 / maxActivity)}%` }}
                                            title={formatDuration(item.seconds, t)}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-600">{item.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-red-700">{t("Do poprawy")}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{t("Najtrudniejsze zadania")}</h2>
                    {data.hardestTasks.length === 0 ? (
                        <p className="mt-8 text-slate-500">{t("Rozwiąż pierwsze zadania, aby zobaczyć analizę.")}</p>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {data.hardestTasks.map((task, index) => (
                                task.attemptCount !== 1 && (
                                    <div key={task.blockId} className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 font-semibold text-red-700">
                                        {index + 1}
                                    </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{task.title}</p>
                                            <p className="truncate text-xs text-slate-500">{task.lessonTitle}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{task.attemptCount}</p>
                                            <p className="text-xs uppercase text-slate-600">{t("prób")}</p>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section>
                <div className="flex items-end justify-between gap-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">{t("Motywacja")}</p>
                        <h2 className="mt-2 text-2xl font-semibold">{t("Osiągnięcia")}</h2>
                    </div>
                    <p className="text-sm text-slate-500">
                        {data.achievements.filter((item) => item.unlocked).length}/{data.achievements.length}
                    </p>
                </div>
                <div className="mt-7 space-y-8">
                    {ACHIEVEMENT_GROUPS.map((group, groupIndex) => {
                        const alreadyAssigned = ACHIEVEMENT_GROUPS
                            .slice(0, groupIndex)
                            .map((item) => item.match);
                        const achievements = data.achievements.filter((achievement) =>
                            group.match(achievement.type)
                            && !alreadyAssigned.some((match) => match(achievement.type))
                        );
                        if (achievements.length === 0) return null;
                        return (
                            <div key={group.key}>
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{t(group.title)}</h3>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {achievements.map((achievement) => {
                                        const progress = achievementProgress(achievement, t, dateLocale);
                                        return (
                                            <article
                                                key={achievement.type}
                                                className={`relative overflow-hidden rounded-xl border p-5 transition ${
                                                    achievement.unlocked
                                                        ? "border-violet-400/30 bg-violet-500/10"
                                                        : "border-slate-200 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className={`grid h-12 w-12 place-items-center rounded-lg text-xl ${
                                                        achievement.unlocked
                                                            ? "bg-violet-500/20 text-violet-800"
                                                            : "bg-white text-slate-600"
                                                    }`}>
                                                        {achievement.unlocked
                                                            ? achievementIcons[achievement.icon] || <BsAwardFill />
                                                            : <BsLockFill />}
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2.5 py-1 text-xs font-semibold text-teal-800">
                                                        <BsGem /> +{achievement.gemReward}
                                                    </span>
                                                </div>
                                                <h4 className="mt-4 font-semibold">{achievement.title}</h4>
                                                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{achievement.description}</p>
                                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${achievement.unlocked ? "bg-violet-400" : "bg-slate-600"}`}
                                                        style={{ width: `${progress.percent}%` }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-[11px] font-bold text-slate-600">
                                                    {achievement.unlocked ? t("Zdobyte") : progress.label}
                                                </p>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">{t("Dokumenty")}</p>
                <h2 className="mt-2 text-2xl font-semibold">{t("Certyfikaty ukończenia")}</h2>
                {data.certificates.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center">
                        <BsAwardFill className="mx-auto text-5xl text-slate-700" />
                        <p className="mt-4 text-slate-500">{t("Certyfikat pojawi się automatycznie po ukończeniu wszystkich lekcji kursu.")}</p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        {data.certificates.map((certificate) => (
                            <article key={certificate.certificateNumber} className="rounded-xl border border-amber-400/20 bg-white p-6">
                                <div className="flex items-start gap-5">
                                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-2xl text-amber-800">
                                        <BsAwardFill />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">{t("Certyfikat EduHub")}</p>
                                        <h3 className="mt-2 text-xl font-semibold">{certificate.courseTitle}</h3>
                                        {certificate.category === "LANGUAGE" && (
                                            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-800">
                                                <BsTranslate />
                                                {t(getCourseLanguageLabel(certificate.courseLanguage))}{" "}{t("· CEFR")}{" "}{certificate.cefrLevel}
                                            </p>
                                        )}
                                        <p className="mt-2 break-all font-mono text-xs text-slate-500">{certificate.certificateNumber}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/certificates/${certificate.certificateNumber}`)}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-5 py-3 font-semibold text-amber-900"
                                >
                                    <BsPrinterFill />{" "}{t("Otwórz i pobierz")}</button>
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
        cyan: "bg-cyan-500/10 text-teal-700",
        green: "bg-emerald-500/10 text-emerald-700",
        violet: "bg-violet-500/10 text-violet-700",
        amber: "bg-amber-500/10 text-amber-800"
    };
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${colors[color]}`}>{icon}</div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}

function RewardShop({ rewards, busy, message, onPurchase }) {
    const { t, dateLocale } = useLocale();
    const groups = [
        { type: "DISCOUNT", title: t("Kupony na kursy"), description: t("Jednorazowe zniżki kupowane za konsekwentną naukę.") },
        { type: "BOOSTER", title: t("Boostery XP"), description: t("Przyspieszają rozwój poziomu, ale nie zwiększają liczby klejnotów.") }
    ];

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid gap-6 border-b border-slate-200 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{t("Skarbiec EduHub")}</p>
                    <h2 className="mt-3 text-2xl font-semibold">{t("Nagrody za wykonaną pracę")}</h2>
                    <p className="mt-3 max-w-2xl leading-7 text-slate-600">{t("Liczy się ukończona lekcja, nie czas spędzony na stronie. Kupon 5% wymaga 2500 klejnotów, czyli 50 pełnych lekcji — około 25 godzin aktywnej pracy przy średnio 30 minutach na lekcję.")}</p>
                </div>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">{t("Dostępne")}</p>
                    <p className="mt-1 flex items-center justify-end gap-2 text-2xl font-semibold"><BsGem /> {Number(rewards.gemBalance).toLocaleString(dateLocale)}</p>
                </div>
            </div>

            {message && (
                <div className="mx-6 mt-6 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.08] px-4 py-3 text-sm font-bold text-teal-800 sm:mx-8">
                    {message}
                </div>
            )}

            <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">{t("Aktywny booster")}</p>
                    <p className="mt-2 text-2xl font-semibold">{rewards.xpBoostPercent > 0 ? t("+{value1}% XP", { value1: rewards.xpBoostPercent }) : t("Brak")}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        {rewards.xpBoostExpiresAt
                            ? t("Działa do {value1}", { value1: new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(rewards.xpBoostExpiresAt)) })
                            : t("Booster możesz aktywować w dowolnym momencie.")}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{t("Portfel kuponów")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {[5, 10, 20].map((percent) => (
                            <span key={percent} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2 text-sm font-semibold text-emerald-800">
                                {percent}% × {rewards.vouchers[`discount${percent}`]}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">{t("Premia ligowa")}</p>
                    <p className="mt-2 text-2xl font-semibold">+{rewards.nextGemRewardAmount}{" "}{t("klejnotów")}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{t("Na poziomie")}{" "}{rewards.nextGemRewardLevel}{t(". Premia wpada co 5 poziomów.")}</p>
                </div>
            </div>

            <LeagueRoadmap currentLeague={rewards.league.name} />

            <div className="space-y-10 border-t border-slate-200 p-6 sm:p-8">
                {groups.map((group) => {
                    const items = rewards.catalog.filter((item) => item.type === group.type);
                    return (
                        <div key={group.type}>
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-semibold">{t(group.title)}</h3>
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
    const { t } = useLocale();
    const leagues = [
        { name: "Miedź", level: "1–10", color: "#fb923c" },
        { name: "Srebro", level: "11–20", color: "#e2e8f0" },
        { name: "Złoto", level: "21–30", color: "#facc15" },
        { name: "Platyna", level: "31–40", color: "#22d3ee" },
        { name: "Kryształ", level: "41–50", color: "#a78bfa" },
        { name: "Diament", level: "51–60", color: "#38bdf8" },
        { name: "Pryzmat", level: "61–70", color: "#f472b6" },
        { name: "Legendarny I", level: "71–80", color: "#fb7185" },
        { name: "Legendarny II", level: "81–90", color: "#ef4444" },
        { name: "Mityczny", level: "91+", color: "#e879f9" }
    ];

    return (
        <div className="border-t border-slate-200 px-6 py-7 sm:px-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t("Droga lig")}</p>
                    <h3 className="mt-2 text-xl font-semibold">{t("Każdy próg ma własną, coraz rzadszą odznakę")}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t("Nowa liga co 10 poziomów. Mityczny to najwyższa liga, dostępna od poziomu 91.")}</p>
                </div>
            </div>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {leagues.map((league) => {
                    const active = currentLeague === league.name;
                    return (
                        <div key={league.name} className={`min-w-[132px] rounded-lg border p-4 ${active ? "bg-teal-50" : "bg-slate-50 opacity-65"}`} style={{ borderColor: `${league.color}${active ? "77" : "22"}`, boxShadow: "none" }}>
                            <LeagueBadge name={league.name} size="md" muted={!active} />
                            <p className="mt-3 text-sm font-semibold" style={{ color: active ? "#175e55" : undefined }}>{t(league.name)}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-600">{t("Poziom")}{" "}{league.level}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RewardCard({ item, gemBalance, busy, onPurchase }) {
    const { t, dateLocale } = useLocale();
    const canAfford = Number(gemBalance) >= item.cost;
    const disabled = Boolean(busy) || !item.available || !canAfford;
    const label = !item.available
        ? t("Poziom {value1}", { value1: item.requiredLevel })
        : !canAfford
            ? t("Za mało klejnotów")
            : t("Kup");

    return (
        <article className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-sm hover:border-teal-300">
            <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-lg text-xl ${item.type === "DISCOUNT" ? "bg-emerald-400/10 text-emerald-700" : "bg-violet-400/10 text-violet-700"}`}>
                    {item.type === "DISCOUNT" ? `${item.discountPercent}%` : <BsLightningChargeFill />}
                </span>
                {item.quantity > 0 && <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">{t("Masz")}{" "}{item.quantity}</span>}
            </div>
            <h4 className="mt-4 text-lg font-semibold">{item.title}</h4>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{item.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-teal-800"><BsGem /> {item.cost.toLocaleString(dateLocale)}</span>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPurchase(item)}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                    {busy === `/rewards/purchase/${item.code}` ? t("Chwila…") : label}
                </button>
            </div>
        </article>
    );
}
