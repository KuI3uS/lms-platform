import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    BsArrowClockwise,
    BsCheckCircle,
    BsCollection,
    BsExclamationTriangle,
    BsHourglassSplit,
    BsLockFill,
    BsPencil,
    BsPlayFill,
    BsPlusCircle,
    BsTrash
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import {
    getCourseCover,
    getGeneratedCourseCover
} from "../utils/courseCover";

function getRoleFromToken() {
    const token = localStorage.getItem("token");

    if (!token) return null;

    try {
        return JSON.parse(atob(token.split(".")[1])).role || null;
    } catch {
        return null;
    }
}

function getErrorMessage(error) {
    try {
        const response = JSON.parse(error.message);
        return response.detail || response.message || response.error || "Wystąpił nieoczekiwany błąd.";
    } catch {
        return error.message || "Wystąpił nieoczekiwany błąd.";
    }
}

function Metric({ label, value }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black sm:text-5xl">{value}</p>
        </div>
    );
}

function formatPrice(price) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: Number(price) % 1 === 0 ? 0 : 2
    }).format(Number(price || 0));
}

function CourseSkeleton() {
    return (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <div className="aspect-[3/2] animate-pulse bg-slate-800/80" />
            <div className="space-y-5 p-6">
                <div className="h-7 w-1/2 animate-pulse rounded-lg bg-slate-800" />
                <div className="space-y-2">
                    <div className="h-4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-800" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-900" />
                    ))}
                </div>
                <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
            </div>
        </div>
    );
}

function CourseCard({ course, isAdmin, deleting, onDelete, onEdit, onOpen }) {
    const progress = Math.min(100, Math.max(0, course.progress ?? 0));
    const pending = course.accessStatus === "PENDING";
    const locked = !course.canAccess && !isAdmin;
    const actionLabel = pending
        ? "Płatność oczekuje"
        : locked
            ? `Kup kurs — ${formatPrice(course.price)}`
            : progress > 0
                ? "Kontynuuj naukę"
                : "Rozpocznij naukę";

    return (
        <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl transition duration-300 md:hover:-translate-y-1 md:hover:border-cyan-400/50 md:hover:shadow-[0_20px_60px_rgba(6,182,212,0.12)]">
            <div className="relative overflow-hidden bg-slate-950">
                <img
                    src={getCourseCover(course)}
                    alt={`Okładka kursu ${course.title || course.name}`}
                    loading="lazy"
                    decoding="async"
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                        currentTarget.src = getGeneratedCourseCover(course);
                    }}
                    className="aspect-[3/2] w-full object-cover transition duration-500 md:group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090d15]/70 via-transparent to-transparent" />
                <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-slate-950/85 px-3 py-1.5 text-xs font-black backdrop-blur-xl">
                    {course.paid ? formatPrice(course.price) : "Bezpłatny"}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
                <div>
                    <h3 className="text-2xl font-black leading-tight">
                        {course.title || course.name}
                    </h3>
                    <p className="mt-3 line-clamp-3 min-h-[4.5rem] leading-6 text-slate-400">
                        {course.description || "Opis kursu zostanie uzupełniony wkrótce."}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/20 p-3 sm:p-4">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Lekcje</p>
                        <p className="mt-2 text-xl font-black sm:text-2xl">{course.lessonCount ?? 0}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/20 p-3 sm:p-4">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Poziom</p>
                        <p className="mt-2 truncate text-sm font-black sm:text-base" title={course.level || "Podstawy"}>
                            {course.level || "Podstawy"}
                        </p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/20 p-3 sm:p-4">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Moduły</p>
                        <p className="mt-2 text-xl font-black sm:text-2xl">{course.moduleCount ?? 0}</p>
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-400">
                        <span>Postęp kursu</span>
                        <span className="font-bold text-slate-200">{progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        Ukończono {course.completedLessonCount ?? 0} z {course.lessonCount ?? 0} lekcji
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onOpen}
                    className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-black transition hover:brightness-110 ${
                        pending
                            ? "border border-amber-500/30 bg-amber-500/10 text-amber-200"
                            : locked
                                ? "bg-gradient-to-r from-violet-500 to-blue-600"
                                : "bg-gradient-to-r from-cyan-500 to-blue-600"
                    }`}
                >
                    {pending ? <BsHourglassSplit /> : locked ? <BsLockFill /> : <BsPlayFill />}
                    {actionLabel}
                </button>

                {isAdmin && (
                    <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                        <button
                            type="button"
                            onClick={onEdit}
                            className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-500/20"
                        >
                            <BsPencil />
                            Edytuj
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
                        >
                            {deleting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-100 border-t-transparent" />
                            ) : (
                                <BsTrash />
                            )}
                            Usuń
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

export default function CoursesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = getRoleFromToken() === "ADMIN";
    const [view, setView] = useState("catalog");

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingCourseId, setDeletingCourseId] = useState(null);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiFetch(view === "mine" ? "/courses/my" : "/courses");
            setCourses(data || []);
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        apiFetch(view === "mine" ? "/courses/my" : "/courses")
            .then((data) => {
                if (active) setCourses(data || []);
            })
            .catch((loadError) => {
                if (active) setError(getErrorMessage(loadError));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [view]);

    const changeView = (nextView) => {
        setLoading(true);
        setError("");
        setView(nextView);
    };

    const deleteCourse = async (course) => {
        const title = course.title || course.name;
        if (!window.confirm(`Usunąć kurs „${title}”?`)) return;

        try {
            setDeletingCourseId(course.id);
            setError("");
            await apiFetch(`/courses/${course.id}`, { method: "DELETE" });
            setCourses((current) => current.filter((item) => item.id !== course.id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError));
        } finally {
            setDeletingCourseId(null);
        }
    };

    const totalLessons = courses.reduce(
        (sum, course) => sum + (course.lessonCount || 0),
        0
    );
    const averageProgress = courses.length
        ? Math.round(courses.reduce((sum, course) => sum + (course.progress || 0), 0) / courses.length)
        : 0;

    return (
        <div className="space-y-8 text-white sm:space-y-12">
            {location.state?.message && (
                <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-200">
                    <BsCheckCircle className="shrink-0" />
                    {location.state.message}
                </div>
            )}

            <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 sm:p-10 lg:rounded-[42px] lg:p-14">
                <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

                <div className="relative z-10 max-w-4xl">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300 sm:text-sm sm:tracking-[0.35em]">
                        EDUHUB • PROGRAMOWANIE
                    </p>
                    <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
                        Ucz się programowania
                        <br className="hidden sm:block" /> w nowoczesny sposób.
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:mt-7 sm:text-xl sm:leading-9">
                        Interaktywne kursy, praktyczne projekty i automatyczne sprawdzanie zadań prowadzą Cię od podstaw do samodzielnego programowania.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2.5 text-sm font-semibold sm:mt-9 sm:gap-3">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-200">Interaktywne lekcje</span>
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-200">Projekty praktyczne</span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-200">Automatyczna ocena</span>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                <Metric label="Dostępnych kursów" value={loading ? "—" : courses.length} />
                <Metric label="Łącznie lekcji" value={loading ? "—" : totalLessons} />
                <Metric label="Średni postęp" value={loading ? "—" : `${averageProgress}%`} />
            </div>

            <section>
                {!isAdmin && (
                    <div className="mb-7 inline-flex rounded-2xl border border-white/10 bg-black/20 p-1.5">
                        <button
                            type="button"
                            onClick={() => changeView("catalog")}
                            className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                                view === "catalog"
                                    ? "bg-cyan-500 text-slate-950"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Katalog
                        </button>
                        <button
                            type="button"
                            onClick={() => changeView("mine")}
                            className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                                view === "mine"
                                    ? "bg-cyan-500 text-slate-950"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Moje kursy
                        </button>
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">Kursy</p>
                        <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                            {view === "mine" && !isAdmin ? "Moje kursy" : "Dostępne ścieżki nauki"}
                        </h2>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => navigate("/admin/add-course")}
                            className="flex items-center justify-center gap-2 self-start rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-500/20 sm:self-auto"
                        >
                            <BsPlusCircle />
                            Dodaj kurs
                        </button>
                    )}
                </div>

                {error && courses.length > 0 && (
                    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-200">
                        <BsExclamationTriangle className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((item) => <CourseSkeleton key={item} />)}
                    </div>
                ) : error && courses.length === 0 ? (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center sm:px-10">
                        <BsExclamationTriangle className="mx-auto text-4xl text-red-300" />
                        <h3 className="mt-4 text-2xl font-black">Nie udało się pobrać kursów</h3>
                        <p className="mx-auto mt-2 max-w-xl text-slate-400">{error}</p>
                        <button
                            type="button"
                            onClick={loadCourses}
                            className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-bold transition hover:bg-white/15"
                        >
                            <BsArrowClockwise /> Spróbuj ponownie
                        </button>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center sm:px-10">
                        <BsCollection className="mx-auto text-5xl text-slate-600" />
                        <h3 className="mt-5 text-2xl font-black">Brak dostępnych kursów</h3>
                        <p className="mx-auto mt-2 max-w-xl text-slate-400">
                            {isAdmin
                                ? "Utwórz pierwszy kurs, a następnie dodaj do niego moduły i lekcje."
                                : view === "mine"
                                    ? "Nie masz jeszcze żadnego kursu. Wybierz kurs z katalogu i aktywuj dostęp."
                                    : "Nowe ścieżki nauki pojawią się tutaj po ich opublikowaniu."}
                        </p>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => navigate("/admin/add-course")}
                                className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                            >
                                <BsPlusCircle /> Utwórz pierwszy kurs
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                isAdmin={isAdmin}
                                deleting={deletingCourseId === course.id}
                                onOpen={() => navigate(
                                    course.canAccess || isAdmin
                                        ? `/modules/${course.id}`
                                        : `/checkout/${course.id}`
                                )}
                                onEdit={() => navigate(`/admin/courses/${course.id}/edit`)}
                                onDelete={() => deleteCourse(course)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
