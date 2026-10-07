import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsAwardFill,
    BsBarChartFill,
    BsBookHalf,
    BsCheckCircleFill,
    BsClockHistory,
    BsFire,
    BsGraphUpArrow,
    BsLightningChargeFill,
    BsLockFill,
    BsPrinterFill,
    BsTrophyFill,
    BsTranslate
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseLanguageLabel } from "../utils/courseTaxonomy";

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
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/learning/analytics")
            .then((response) => {
                if (active) setData(response);
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

    const maxActivity = useMemo(
        () => Math.max(1, ...(data?.recentActivity || []).map((item) => item.seconds)),
        [data]
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
            <section className="relative overflow-hidden rounded-[38px] border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-emerald-950/50 to-blue-950 p-7 sm:p-11">
                <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Centrum rozwoju</p>
                    <h1 className="mt-4 text-4xl font-black sm:text-6xl">Twoja nauka w liczbach</h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                        Analizuj skuteczność, sprawdzaj najtrudniejsze zadania,
                        zdobywaj osiągnięcia i odbieraj certyfikaty.
                    </p>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={<BsClockHistory />} label="Czas nauki" value={formatDuration(data.totalStudySeconds)} color="cyan" />
                <Stat icon={<BsCheckCircleFill />} label="Ukończone lekcje" value={data.completedLessons} color="green" />
                <Stat icon={<BsGraphUpArrow />} label="Skuteczność zadań" value={`${data.taskAccuracy}%`} color="violet" />
                <Stat icon={<BsTrophyFill />} label="Średnia egzaminów" value={`${data.examAverage}%`} color="amber" />
            </div>

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
