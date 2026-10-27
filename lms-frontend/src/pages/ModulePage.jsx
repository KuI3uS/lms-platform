import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsArrowLeft,
    BsChevronDown,
    BsCheckCircle,
    BsLockFill,
    BsPlayFill,
    BsPlusCircle,
    BsTrash,
    BsGearFill,
    BsPencilSquare,
    BsCodeSlash,
    BsTranslate,
    BsFileText,
    BsLightbulb,
    BsInfoCircle,
    BsImage,
    BsPlayBtn,
    BsHeadphones,
    BsQuestionCircle,
    BsGrid3X3Gap,
    BsChatDots,
    BsTools,
    BsBug,
    BsEye,
    BsClipboardCheck,
    BsChatLeftText
} from "react-icons/bs";
import {
    CEFR_LEVELS,
    getCourseCategory,
    getCourseLanguageLabel
} from "../utils/courseTaxonomy";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import CourseSectionHeading from "../components/CourseSectionHeading";
import LessonPlanImport from "../components/LessonPlanImport";
import CourseDuplicateCleanup from "../components/CourseDuplicateCleanup";
import CourseRoadmapSearch from "../components/CourseRoadmapSearch";
import { filterCourseRoadmap } from "../utils/courseRoadmapSearch";
import {
    buildCourseSections,
    courseSectionExpansionKey,
    readCourseSectionExpansion,
    saveCourseSectionExpansion
} from "../utils/courseSections";
import {
    canAccessLessonStep,
    getActiveLessonStepIndex,
    isLessonStepCompleted
} from "../utils/lessonSteps";

const ROADMAP_CACHE_TTL = 60_000;
const roadmapCache = new Map();

export default function ModulePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirm, showToast } = useFeedback();

    const [modules, setModules] = useState([]);
    const [course, setCourse] = useState(null);
    const [newModule, setNewModule] = useState("");
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [moduleDraft, setModuleDraft] = useState(null);
    const [savingModuleId, setSavingModuleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [moduleExpansion, setModuleExpansion] = useState({});
    const [sectionExpansion, setSectionExpansion] = useState(readCourseSectionExpansion);
    const [courseSearch, setCourseSearch] = useState({ courseId: null, query: "" });
    const [searchExpansion, setSearchExpansion] = useState({ scope: null, panels: {} });
    const [stepRoadmap, setStepRoadmap] = useState({
        lessonId: null,
        steps: [],
        error: ""
    });

    const role = user?.role || null;
    const searchQuery = courseSearch.courseId === courseId ? courseSearch.query : "";
    const sections = useMemo(() => buildCourseSections(modules), [modules]);
    const search = useMemo(() => filterCourseRoadmap(sections, searchQuery), [sections, searchQuery]);
    const searchScope = `${courseId}:${searchQuery}`;
    const searchPanelExpanded = key => searchExpansion.scope === searchScope
        ? (searchExpansion.panels[key] ?? true)
        : true;
    const toggleSearchPanel = key => setSearchExpansion(previous => {
        const panels = previous.scope === searchScope ? previous.panels : {};
        return { scope: searchScope, panels: { ...panels, [key]: !(panels[key] ?? true) } };
    });

    useEffect(() => {
        saveCourseSectionExpansion(sectionExpansion);
    }, [sectionExpansion]);

    const loadRoadmap = useCallback(async () => {
        const cached = roadmapCache.get(String(courseId));
        const cacheIsFresh = cached
            && Date.now() - cached.savedAt < ROADMAP_CACHE_TTL;

        if (cacheIsFresh) {
            setCourse(cached.course);
            setModules(cached.modules);
            setLoading(false);
        } else {
            setLoading(true);
        }
        setError("");

        try {
            const roadmap = await apiFetch(
                `/modules/course/${courseId}/roadmap`
            );
            const courseData = {
                id: roadmap.id,
                name: roadmap.name,
                title: roadmap.title,
                category: roadmap.category,
                courseLanguage: roadmap.courseLanguage,
                cefrLevel: roadmap.cefrLevel,
                cefrEndLevel: roadmap.cefrEndLevel,
                unlockedCefrLevel: roadmap.unlockedCefrLevel
            };
            const moduleData = roadmap.modules || [];

            roadmapCache.set(String(courseId), {
                course: courseData,
                modules: moduleData,
                savedAt: Date.now()
            });
            setCourse(courseData);
            setModules(moduleData);
        } catch (e) {
            console.error(e);
            if (!cacheIsFresh) {
                setError(e.message || "Nie udało się pobrać ścieżki kursu.");
            }
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        const timer = window.setTimeout(loadRoadmap, 0);
        return () => window.clearTimeout(timer);
    }, [loadRoadmap]);

    const createModule = async () => {
        if (!newModule.trim()) {
            showToast("Podaj nazwę sekcji.", "warning");
            return;
        }

        const module = await apiFetch(`/modules/course/${courseId}`, {
            method: "POST",
            body: JSON.stringify({
                name: newModule,
                lessonsLocked: true,
                sectionTitle: newSectionTitle.trim() || null
            })
        });

        setModules(prev => [...prev, { ...module, lessons: [] }]);
        roadmapCache.delete(String(courseId));
        setNewModule("");
        setNewSectionTitle("");
    };

    const deleteModule = async (module) => {
        if (!await confirm({
            title: "Trwale usuń moduł",
            message: `Czy na pewno usunąć moduł „${module.name}”? Zostaną trwale usunięte wszystkie jego lekcje, bloki, odpowiedzi, wyniki i postępy uczniów. Tej operacji nie można cofnąć.`,
            confirmLabel: "Usuń wszystko"
        })) return;

        try {
            await apiFetch(`/modules/${module.id}`, { method: "DELETE" });
            setModules(prev => prev.filter(item => item.id !== module.id));
            roadmapCache.delete(String(courseId));
            showToast("Moduł i cała jego zawartość zostały usunięte.", "success");
        } catch (deleteError) {
            setError(deleteError.message || "Nie udało się usunąć modułu.");
        }
    };

    const saveSectionTitle = async (module, sectionTitle) => {
        const current = await apiFetch(`/modules/${module.id}`);
        const saved = await apiFetch(`/modules/${module.id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: current.name,
                lessonsLocked: current.lessonsLocked,
                cefrLevel: current.cefrLevel,
                sectionTitle
            })
        });
        setModules(previous => previous.map(item => (
            item.id === module.id ? { ...item, ...saved } : item
        )));
        roadmapCache.delete(String(courseId));
        showToast(sectionTitle ? "Nagłówek został zapisany." : "Nagłówek został usunięty.", "success");
    };

    const startEditingModule = module => {
        setEditingModuleId(module.id);
        setModuleDraft({
            name: module.name || "",
            sectionTitle: module.sectionTitle || "",
            lessonsLocked: Boolean(module.lessonsLocked),
            cefrLevel: module.cefrLevel || null
        });
    };

    const cancelEditingModule = () => {
        setEditingModuleId(null);
        setModuleDraft(null);
    };

    const saveEditedModule = async module => {
        if (!moduleDraft?.name?.trim()) {
            showToast("Nazwa etapu nie może być pusta.", "warning");
            return;
        }

        try {
            setSavingModuleId(module.id);
            setError("");
            const saved = await apiFetch(`/modules/${module.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: moduleDraft.name.trim(),
                    sectionTitle: moduleDraft.sectionTitle?.trim() || null,
                    lessonsLocked: moduleDraft.lessonsLocked,
                    cefrLevel: moduleDraft.cefrLevel
                })
            });
            setModules(current => current.map(item => (
                item.id === module.id ? { ...item, ...saved } : item
            )));
            roadmapCache.delete(String(courseId));
            cancelEditingModule();
            showToast("Etap został zapisany.", "success");
        } catch (saveError) {
            setError(saveError.message || "Nie udało się zapisać etapu.");
        } finally {
            setSavingModuleId(null);
        }
    };

    const isLanguageCourse = getCourseCategory(course) === "LANGUAGE";
    const allLessons = modules.flatMap(module => (module.lessons || []).map(lesson => ({
        ...lesson,
        moduleCefrLevel: module.cefrLevel,
        belowCurrentLanguageLevel: isLanguageCourse && isCefrBelow(
            module.cefrLevel,
            course?.unlockedCefrLevel
        )
    })));
    const currentLevelLesson = isLanguageCourse
        ? allLessons.find(lesson => (
            lesson.moduleCefrLevel === course?.unlockedCefrLevel
            && lesson.canAccess
            && !lesson.completed
        ))
        : null;
    const activeLesson = currentLevelLesson || allLessons.find(lesson => (
        lesson.canAccess
        && !lesson.completed
        && !lesson.belowCurrentLanguageLevel
    )) || null;
    const activeLessonId = activeLesson?.id ?? null;
    const activeModuleId = modules.find(module => (
        (module.lessons || []).some(lesson => lesson.id === activeLessonId)
    ))?.id;
    const isModuleExpanded = module => (
        search.active ? searchPanelExpanded(`module:${module.id}`)
            : moduleExpansion[`${courseId}:${module.id}`] ?? (module.id === activeModuleId)
    );
    const expandedModuleCount = modules.filter(isModuleExpanded).length;
    const toggleModule = module => {
        if (search.active) return toggleSearchPanel(`module:${module.id}`);
        const expanded = isModuleExpanded(module);
        setModuleExpansion(previous => ({
            ...previous,
            [`${courseId}:${module.id}`]: !expanded
        }));
    };
    const setAllModulesExpanded = expanded => {
        setModuleExpansion(previous => ({
            ...previous,
            ...Object.fromEntries(modules.map(module => (
                [`${courseId}:${module.id}`, expanded]
            )))
        }));
    };
    const activeSectionId = sections.find(section => section.entries.some(
        ({ module }) => module.id === activeModuleId
    ))?.id ?? sections[0]?.id;
    const sectionKey = section => courseSectionExpansionKey(courseId, user?.id, section.id);
    const isSectionExpanded = section => (
        search.active ? searchPanelExpanded(`section:${section.id}`)
            : sectionExpansion[sectionKey(section)] ?? (section.id === activeSectionId)
    );
    const expandedSectionCount = sections.filter(isSectionExpanded).length;
    const toggleSection = section => {
        if (search.active) return toggleSearchPanel(`section:${section.id}`);
        setSectionExpansion(previous => ({
            ...previous,
            [sectionKey(section)]: !isSectionExpanded(section)
        }));
    };
    const setAllSectionsExpanded = expanded => {
        setSectionExpansion(previous => ({
            ...previous,
            ...Object.fromEntries(sections.map(section => [sectionKey(section), expanded]))
        }));
    };
    const progressLessons = role === "ADMIN"
        ? allLessons
        : allLessons.filter(lesson => lesson.hasContent !== false);
    const completedCount = progressLessons.filter(lesson => (
        lesson.completed || lesson.belowCurrentLanguageLevel
    )).length;
    const progress = progressLessons.length > 0
        ? Math.round((completedCount / progressLessons.length) * 100)
        : 0;

    useEffect(() => {
        if (!activeLessonId) return undefined;

        let cancelled = false;

        apiFetch(`/lesson-blocks/lesson/${activeLessonId}`)
            .then(data => {
                if (cancelled) return;
                setStepRoadmap({
                    lessonId: activeLessonId,
                    steps: [...(data || [])].sort(
                        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    ),
                    error: ""
                });
            })
            .catch(requestError => {
                if (cancelled) return;
                console.error(requestError);
                setStepRoadmap({
                    lessonId: activeLessonId,
                    steps: [],
                    error: "Nie udało się pobrać kroków tej lekcji."
                });
            });

        return () => {
            cancelled = true;
        };
    }, [activeLessonId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
                {error}
            </div>
        );
    }

    return (
        <div className="course-roadmap mx-auto max-w-6xl space-y-6 text-slate-900">
            <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                <button
                    type="button"
                    onClick={() => navigate("/courses")}
                    className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                    <BsArrowLeft />
                    Wróć do kursów
                </button>
                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                    <div className="min-w-0">
                        <p className="mb-3 text-sm font-semibold text-teal-800">
                            {isLanguageCourse ? (
                                <span className="inline-flex items-center gap-2">
                                    <BsTranslate />
                                    {getCourseLanguageLabel(course?.courseLanguage)} · CEFR {course?.cefrLevel}{course?.cefrEndLevel !== course?.cefrLevel ? `–${course?.cefrEndLevel}` : ""}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <BsCodeSlash />
                                    Ścieżka technologiczna
                                </span>
                            )}
                        </p>
                        <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 [overflow-wrap:anywhere] sm:text-3xl">
                            {course?.title || course?.name || "Roadmap kursu"}
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                            {isLanguageCourse
                                ? "Krótka lekcja po krótkiej lekcji — aż do certyfikatu."
                                : "Wybierz etap i przejdź do lekcji. Zapisany postęp pomoże Ci wrócić do nauki."}
                        </p>
                    </div>

                    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">Postęp całego kursu</span>
                            <span className="font-bold text-teal-800">{progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-teal-700 transition-[width] duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm leading-5 text-slate-600">
                            Zaliczono {completedCount} z {progressLessons.length} dostępnych lekcji lub ich odpowiedników
                        </p>
                        {isLanguageCourse && (
                            <button
                                type="button"
                                onClick={() => navigate("/exams")}
                                className="mt-4 w-full rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
                            >
                                Egzaminy i poziomy CEFR
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {modules.length > 0 && <CourseRoadmapSearch
                appearance="light"
                query={searchQuery}
                onChange={query => {
                    setCourseSearch({ courseId, query });
                    setSearchExpansion({ scope: null, panels: {} });
                }}
                active={search.active}
                moduleCount={search.moduleCount}
                lessonCount={search.lessonCount}
            />}

            {role === "ADMIN" && (
                <details className="mx-auto max-w-5xl rounded-2xl border border-slate-300 bg-white p-4 sm:p-5">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-teal-700">Narzędzia administratora — dodawanie etapów i import</summary>
                    <div className="mt-5 space-y-5">
                    <section className="space-y-3">
                        <input
                            value={newSectionTitle}
                            onChange={e => setNewSectionTitle(e.target.value)}
                            maxLength={200}
                            placeholder="Opcjonalny nagłówek części, np. CZĘŚĆ I — Java od zera"
                            className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-bold text-violet-900 outline-none transition focus:border-violet-400"
                        />
                        <p className="text-xs text-slate-600">
                            Nagłówek możesz też dodać później — wybierz „Dodaj nagłówek” nad dowolnym etapem poniżej.
                        </p>
                        <div className="flex gap-3">
                            <input
                                value={newModule}
                                onChange={e => setNewModule(e.target.value)}
                                placeholder="Nazwa nowego modułu, np. Zmienne i typy danych"
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                            />

                            <button
                                onClick={createModule}
                                className="flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white transition hover:bg-teal-900"
                            >
                                <BsPlusCircle />
                                Dodaj
                            </button>
                        </div>
                    </section>

                    <div className="rounded-2xl bg-slate-950 p-4 text-white"><LessonPlanImport
                        courseId={courseId}
                        moduleCount={modules.length}
                        existingModules={modules}
                        onImported={async () => {
                            roadmapCache.delete(String(courseId));
                            await loadRoadmap();
                        }}
                    /></div>
                    <div className="rounded-2xl bg-slate-950 p-4 text-white"><CourseDuplicateCleanup
                        key={courseId}
                        courseId={courseId}
                        onCleaned={async () => {
                            roadmapCache.delete(String(courseId));
                            await loadRoadmap();
                        }}
                    /></div>
                    </div>
                </details>
            )}

            <section className="mx-auto max-w-5xl space-y-4 pb-16">
                {modules.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                        <p className="text-sm font-bold text-slate-600">Części: {sections.length} · Etapy: {modules.length}</p>
                        {!search.active && <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={expandedSectionCount === 0}
                                onClick={() => setAllSectionsExpanded(false)}
                                className="rounded-xl border border-violet-200 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-default disabled:opacity-40"
                            >
                                Zwiń wszystkie części
                            </button>
                            <button
                                type="button"
                                disabled={expandedSectionCount === sections.length}
                                onClick={() => setAllSectionsExpanded(true)}
                                className="rounded-xl border border-violet-200 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-default disabled:opacity-40"
                            >
                                Rozwiń wszystkie części
                            </button>
                            <button
                                type="button"
                                disabled={expandedModuleCount === 0}
                                onClick={() => setAllModulesExpanded(false)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-default disabled:opacity-40"
                            >
                                Zwiń etapy
                            </button>
                            <button
                                type="button"
                                disabled={expandedModuleCount === modules.length}
                                onClick={() => setAllModulesExpanded(true)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-default disabled:opacity-40"
                            >
                                Rozwiń etapy
                            </button>
                        </div>}
                    </div>
                )}
                {modules.length === 0 ? (
                    <div className="py-16 text-center text-slate-600">
                        Brak sekcji w tym kursie.
                    </div>
                ) : (
                    search.sections.map(section => {
                        const firstModule = section.firstModule;
                        const sectionExpanded = isSectionExpanded(section);
                        const sectionPanelId = `course-${courseId}-section-${section.id}`;
                        const stageRange = section.startStageNumber === section.endStageNumber
                            ? `Etap ${section.startStageNumber}`
                            : `Etapy ${section.startStageNumber}–${section.endStageNumber}`;
                        return (
                            <section key={`${courseId}:section:${section.id}`} className="space-y-4 pt-3">
                                <CourseSectionHeading
                                    appearance="light"
                                    title={section.title}
                                    moduleName={firstModule.name}
                                    stageNumber={section.startStageNumber}
                                    canEdit={role === "ADMIN"}
                                    onSave={title => saveSectionTitle(firstModule, title)}
                                    expanded={sectionExpanded}
                                    onToggle={() => toggleSection(section)}
                                    panelId={sectionPanelId}
                                    summary={search.active
                                        ? `${stageRange} · Znalezione etapy: ${section.entries.length} · Lekcje w wynikach: ${section.entries.reduce((count, entry) => count + entry.lessonEntries.length, 0)}`
                                        : `${stageRange} · Liczba etapów: ${section.entries.length} · Lekcje: ${section.lessonCount}`}
                                    fallbackTitle={sections.length === 1 ? "Etapy kursu" : "Etapy bez nagłówka"}
                                />
                                <div id={sectionPanelId} hidden={!sectionExpanded} className="space-y-4">
                                    {sectionExpanded && section.entries.map(({ module, moduleIndex, lessonEntries }) => {
                                        const lessons = module.lessons || [];
                                        const progressEligibleLessons = role === "ADMIN"
                                            ? lessons
                                            : lessons.filter(lesson => lesson.hasContent !== false);
                                        const completedLessons = progressEligibleLessons.filter(
                                            lesson => lesson.completed
                                        ).length;
                                        const levelBelowCurrent = isLanguageCourse && isCefrBelow(
                                            module.cefrLevel,
                                            course?.unlockedCefrLevel
                                        );
                                        const moduleProgress = progressEligibleLessons.length
                                            ? Math.round((completedLessons / progressEligibleLessons.length) * 100)
                                            : 0;
                                        const expanded = isModuleExpanded(module);
                                        const lessonsPanelId = `module-${courseId}-${module.id}-lessons`;

                                        return (
                                            <div key={`${courseId}:${module.id}`}>
                                                {module.id !== firstModule.id && <CourseSectionHeading
                                                    appearance="light"
                                                    moduleName={module.name}
                                                    stageNumber={moduleIndex + 1}
                                                    canEdit={role === "ADMIN"}
                                                    onSave={title => saveSectionTitle(module, title)}
                                                />}
                                                <article
                                                    className="relative rounded-2xl border border-slate-200 bg-white"
                                                >
                                                <header className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                                    <div className="flex min-w-0 flex-1 items-center gap-4">
                                                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-500/15 text-base font-black text-teal-800 ring-1 ring-blue-300/20">
                                                            {moduleIndex + 1}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">
                                                                    {isLanguageCourse ? `CEFR ${module.cefrLevel}` : `Etap ${moduleIndex + 1}`}
                                                                </p>
                                                                {role === "ADMIN" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => startEditingModule(module)}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-teal-800 transition hover:border-blue-300/40 hover:bg-blue-500/20 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                                                                    >
                                                                        <BsPencilSquare aria-hidden="true" />
                                                                        Edytuj nazwę
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <h2 className="mt-1 text-lg font-black sm:text-xl">
                                                                <button
                                                                    type="button"
                                                                    aria-expanded={expanded}
                                                                    aria-controls={lessonsPanelId}
                                                                    aria-label={`${expanded ? "Zwiń" : "Rozwiń"} etap ${module.name}`}
                                                                    onClick={() => toggleModule(module)}
                                                                    className="flex w-full items-center justify-between gap-3 rounded-lg text-left transition hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                                                                >
                                                                    <span>{module.name}</span>
                                                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-teal-800">
                                                                        <BsChevronDown
                                                                            aria-hidden="true"
                                                                            className={`transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                                                                        />
                                                                    </span>
                                                                </button>
                                                            </h2>
                                                            <p className="mt-1 text-xs text-slate-600">
                                                                {progressEligibleLessons.length} {progressEligibleLessons.length === 1 ? "dostępna lekcja" : "dostępnych lekcji"} · ukończono {completedLessons}
                                                                {isLanguageCourse && !module.levelUnlocked ? " · poziom zablokowany" : ""}
                                                                {levelBelowCurrent && completedLessons < lessons.length ? " · potwierdzony testem kwalifikacyjnym" : ""}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                                                                <div
                                                                    className="h-full rounded-full bg-teal-700 transition-[width] duration-500"
                                                                    style={{ width: `${moduleProgress}%` }}
                                                                />
                                                            </div>
                                                            <span>{moduleProgress}%</span>
                                                        </div>

                                                        {role === "ADMIN" && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Zarządzaj lekcjami etapu ${module.name}`}
                                                                    onClick={() => navigate(`/admin/lessons/${module.id}`)}
                                                                    className="grid h-10 w-10 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-900 transition hover:bg-amber-100"
                                                                >
                                                                    <BsGearFill />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Usuń etap ${module.name}`}
                                                                    onClick={() => deleteModule(module)}
                                                                    className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-red-50 text-red-800 transition hover:bg-red-100"
                                                                >
                                                                    <BsTrash />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </header>

                                                {role === "ADMIN" && editingModuleId === module.id && moduleDraft && (
                                                    <section className="border-t border-blue-400/15 bg-blue-500/[0.04] p-5 sm:p-6">
                                                        <div className="grid gap-5">
                                                            <div>
                                                                <label className="text-xs font-black uppercase tracking-[0.16em] text-teal-800">
                                                                    Nazwa etapu
                                                                </label>
                                                                <input
                                                                    value={moduleDraft.name}
                                                                    maxLength={255}
                                                                    autoFocus
                                                                    onChange={event => setModuleDraft(current => ({
                                                                        ...current,
                                                                        name: event.target.value
                                                                    }))}
                                                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-teal-700"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-xs font-black uppercase tracking-[0.16em] text-violet-800">
                                                                    Nagłówek części nad etapem — opcjonalnie
                                                                </label>
                                                                <input
                                                                    value={moduleDraft.sectionTitle}
                                                                    maxLength={200}
                                                                    onChange={event => setModuleDraft(current => ({
                                                                        ...current,
                                                                        sectionTitle: event.target.value
                                                                    }))}
                                                                    placeholder="Np. CZĘŚĆ XX — Rekrutacja Junior Java Developer"
                                                                    className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-bold text-violet-900 outline-none focus:border-violet-400"
                                                                />
                                                            </div>

                                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                                <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={moduleDraft.lessonsLocked}
                                                                        onChange={event => setModuleDraft(current => ({
                                                                            ...current,
                                                                            lessonsLocked: event.target.checked
                                                                        }))}
                                                                        className="h-4 w-4 accent-blue-500"
                                                                    />
                                                                    Odblokowuj lekcje kolejno
                                                                </label>

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelEditingModule}
                                                                        disabled={savingModuleId === module.id}
                                                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                                                    >
                                                                        Anuluj
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => saveEditedModule(module)}
                                                                        disabled={savingModuleId === module.id || !moduleDraft.name.trim()}
                                                                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-40"
                                                                    >
                                                                        {savingModuleId === module.id ? "Zapisywanie..." : "Zapisz etap"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}

                                                <div
                                                    id={lessonsPanelId}
                                                    hidden={!expanded}
                                                    className="border-t border-slate-200 pb-6 pt-6"
                                                >
                                                    {expanded && (lessons.length === 0 ? (
                                                        <div className="flex flex-col items-center py-5 text-center">
                                                            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-slate-300 text-slate-600">
                                                                <BsLockFill />
                                                            </div>
                                                            <p className="mt-3 text-sm text-slate-600">
                                                                Lekcje w przygotowaniu
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <ol className="space-y-4 py-2">
                                                            {lessonEntries.map(({ lesson, lessonIndex: index }) => {
                                                                const offsets = [0, -64, 0, 64];
                                                                const offset = offsets[index % offsets.length];
                                                                const current = Number(lesson.id) === Number(activeLessonId);
                                                                const currentSteps = current
                                                                    && Number(stepRoadmap.lessonId) === Number(lesson.id)
                                                                    ? stepRoadmap.steps
                                                                    : [];
                                                                const stepsLoading = current
                                                                    && Number(stepRoadmap.lessonId) !== Number(lesson.id);
                                                                const hasContent = lesson.hasContent !== false;
                                                                const lessonAccessible = Boolean(
                                                                    lesson.canAccess
                                                                    && (role === "ADMIN" || hasContent)
                                                                );

                                                                return (
                                                                    <li
                                                                        key={lesson.id}
                                                                        className="flex flex-col items-center py-2"
                                                                    >
                                                                        <div
                                                                            className="transition-transform duration-500 ease-out"
                                                                            style={{ transform: `translateX(${offset}px)` }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                disabled={!lessonAccessible}
                                                                                onClick={() => lessonAccessible && navigate(`/lesson/${lesson.id}`, {
                                                                                    state: { courseId: Number(courseId) }
                                                                                })}
                                                                                aria-label={`Lekcja ${index + 1}: ${lesson.title}`}
                                                                                className="group flex w-56 flex-col items-center text-center disabled:cursor-not-allowed"
                                                                            >
                                                                                {current && (
                                                                                    <span className="mb-2 rounded-full bg-teal-800 px-3 py-1 text-xs font-semibold text-white">
                                                                                        Kontynuuj
                                                                                    </span>
                                                                                )}
                                                                                <span className={`relative grid h-20 w-20 place-items-center rounded-full border-2 border-b-[7px] text-2xl font-black transition-all duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-active:translate-y-0 ${
                                                                                    lesson.completed
                                                                                        ? "border-emerald-700 border-b-emerald-900 bg-emerald-700 text-white"
                                                                                        : lessonAccessible
                                                                                            ? "border-blue-300/80 border-b-blue-800 bg-blue-600 text-white shadow-xl shadow-blue-500/25"
                                                                                            : "border-slate-300 border-b-slate-300 bg-slate-100 text-slate-600"
                                                                                }`}>
                                                                                    {lesson.completed ? (
                                                                                        <BsCheckCircle size={30} />
                                                                                    ) : lessonAccessible ? (
                                                                                        <BsPlayFill className="ml-1" size={28} />
                                                                                    ) : (
                                                                                        <BsLockFill size={23} />
                                                                                    )}
                                                                                </span>
                                                                                <span className="mt-3 text-xs font-semibold text-slate-600">
                                                                                    Lekcja {index + 1}
                                                                                </span>
                                                                                <span className={`mt-1 line-clamp-2 max-w-52 text-sm font-black leading-5 ${
                                                                                    lessonAccessible ? "text-slate-900" : "text-slate-600"
                                                                                }`}>
                                                                                    {lesson.title}
                                                                                </span>
                                                                                {!hasContent && role !== "ADMIN" && (
                                                                                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                                                                        Materiały w przygotowaniu
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        </div>

                                                                        {current && (
                                                                            <LessonSubsteps
                                                                                lesson={lesson}
                                                                                steps={currentSteps}
                                                                                loading={stepsLoading}
                                                                                error={stepRoadmap.error}
                                                                                onOpenStep={step => navigate(
                                                                                    `/lesson/${lesson.id}?step=${step.id}`,
                                                                                    { state: { courseId: Number(courseId) } }
                                                                                )}
                                                                            />
                                                                        )}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ol>
                                                    ))}
                                                </div>
                                                </article>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })
                )}
            </section>
        </div>
    );
}

function isCefrBelow(level, currentLevel) {
    const levelIndex = CEFR_LEVELS.indexOf(level);
    const currentIndex = CEFR_LEVELS.indexOf(currentLevel);
    return levelIndex >= 0 && currentIndex >= 0 && levelIndex < currentIndex;
}

function LessonSubsteps({ lesson, steps, loading, error, onOpenStep }) {
    if (loading) {
        return (
            <div className="lesson-step-transition mt-7 flex flex-col items-center gap-3" aria-label="Ładowanie podzadań">
                <div className="h-3 w-36 animate-pulse rounded-full bg-slate-200" />
                {[0, 1, 2].map(item => (
                    <div
                        key={item}
                        className="h-11 w-11 animate-pulse rounded-full bg-slate-200"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="mt-6 max-w-xs text-center text-xs text-red-800">
                {error}
            </p>
        );
    }

    if (!steps.length) return null;

    const activeIndex = getActiveLessonStepIndex(steps, false);
    const completedCount = steps.filter((_, index) => (
        isLessonStepCompleted(steps, index, false)
    )).length;
    const readyToFinish = completedCount === steps.length;
    const offsets = [-48, -18, 22, 52, 22, -18];

    return (
        <section
            className="lesson-step-transition mt-7 w-full max-w-md"
            aria-label={`Podzadania lekcji ${lesson.title}`}
        >
            <header className="mb-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-800">
                    Podzadania tej lekcji
                </p>
                <p className={`mt-1 text-xs font-bold ${
                    readyToFinish ? "text-emerald-800" : "text-slate-600"
                }`}>
                    {readyToFinish
                        ? "Wszystkie kroki gotowe — zakończ lekcję"
                        : `${completedCount}/${steps.length} wykonanych kroków`}
                </p>
            </header>

            <div className="relative">
                <div
                    aria-hidden="true"
                    className="absolute bottom-6 left-1/2 top-5 w-px -translate-x-1/2 bg-gradient-to-b from-blue-500/40 via-white/10 to-transparent"
                />

                <ol className="relative space-y-1 py-1">
                    {steps.map((step, index) => {
                        const completed = isLessonStepCompleted(steps, index, false);
                        const accessible = canAccessLessonStep(steps, index);
                        const active = index === activeIndex;
                        const offset = offsets[index % offsets.length];

                        return (
                            <li
                                key={step.id}
                                className="relative flex justify-center py-1.5"
                                style={{ transform: `translateX(${offset}px)` }}
                            >
                                <button
                                    type="button"
                                    disabled={!accessible}
                                    onClick={() => accessible && onOpenStep(step)}
                                    title={`${index + 1}. ${step.title || stepTypeLabel(step.type)}`}
                                    className="group flex w-44 items-center gap-3 text-left disabled:cursor-not-allowed"
                                >
                                    <span className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-b-4 text-sm transition-all duration-200 motion-safe:group-hover:-translate-y-0.5 ${
                                        completed
                                            ? "border-emerald-700 border-b-emerald-900 bg-emerald-700 text-white"
                                            : active
                                                ? "border-cyan-200 border-b-blue-900 bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/15"
                                                : accessible
                                                    ? "border-slate-300 border-b-gray-950 bg-slate-200 text-slate-700 group-hover:border-blue-400 group-hover:text-teal-900"
                                                    : "border-slate-300 border-b-slate-300 bg-slate-100 text-slate-600"
                                    }`}>
                                        {completed
                                            ? <BsCheckCircle size={17} />
                                            : accessible
                                                ? stepIcon(step.type)
                                                : <BsLockFill size={14} />}
                                    </span>

                                    <span className="min-w-0">
                                        <span className={`block text-[11px] font-semibold ${
                                            active
                                                ? "text-teal-800"
                                                : completed
                                                    ? "text-emerald-800"
                                                    : "text-slate-600"
                                        }`}>
                                            Krok {index + 1}
                                        </span>
                                        <span className={`mt-0.5 line-clamp-2 block text-xs font-semibold leading-5 ${
                                            accessible ? "text-slate-700" : "text-slate-600"
                                        }`}>
                                            {step.title || stepTypeLabel(step.type)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

function stepIcon(type) {
    switch (type) {
        case "TIP":
            return <BsLightbulb />;
        case "INFO":
            return <BsInfoCircle />;
        case "IMAGE":
            return <BsImage />;
        case "VIDEO":
            return <BsPlayBtn />;
        case "AUDIO":
            return <BsHeadphones />;
        case "DIALOG":
            return <BsChatDots />;
        case "VOCABULARY":
            return <BsTranslate />;
        case "WORD_LAB":
            return <BsTranslate />;
        case "LISTENING":
            return <BsHeadphones />;
        case "SENTENCE_BUILDER":
            return <BsGrid3X3Gap />;
        case "EXAMPLE":
            return <BsCodeSlash />;
        case "TASK":
        case "QUIZ":
            return <BsQuestionCircle />;
        case "PRACTICAL_LAB":
            return <BsTools />;
        case "DEBUGGING":
            return <BsBug />;
        case "PREDICT_OUTPUT":
            return <BsEye />;
        case "CODE_REVIEW":
            return <BsClipboardCheck />;
        case "OPEN_RESPONSE":
            return <BsChatLeftText />;
        default:
            return <BsFileText />;
    }
}

function stepTypeLabel(type) {
    const labels = {
        TEXT: "Materiał",
        TIP: "Wskazówka",
        WARNING: "Ostrzeżenie",
        INFO: "Informacja",
        SUMMARY: "Podsumowanie",
        IMAGE: "Obraz",
        VIDEO: "Film",
        AUDIO: "Wymowa",
        DIALOG: "Dialog",
        VOCABULARY: "Słówka",
        WORD_LAB: "Laboratorium słów",
        LISTENING: "Rozpoznawanie ze słuchu",
        SENTENCE_BUILDER: "Układanie zdania",
        EXAMPLE: "Przykład",
        TASK: "Zadanie",
        PRACTICAL_LAB: "Laboratorium praktyczne",
        DEBUGGING: "Debugowanie",
        PREDICT_OUTPUT: "Przewidź wynik",
        CODE_REVIEW: "Code Review",
        OPEN_RESPONSE: "Odpowiedź otwarta",
        QUIZ: "Quiz"
    };

    return labels[type] || "Krok lekcji";
}
