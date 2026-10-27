import { useRef } from "react";
import { BsSearch, BsX } from "react-icons/bs";

export default function CourseRoadmapSearch({ query, onChange, active, moduleCount, lessonCount, appearance = "dark" }) {
    const input = useRef(null);
    const light = appearance === "light";
    const clear = () => {
        onChange("");
        input.current?.focus();
    };

    return (
        <form
            role="search"
            aria-label="Wyszukiwanie w kursie"
            onSubmit={event => event.preventDefault()}
            className={`mx-auto w-full max-w-3xl rounded-2xl border p-4 sm:p-5 ${light ? "border-slate-200 bg-white" : "border-cyan-300/20 bg-cyan-500/[0.04]"}`}
        >
            <label htmlFor="course-roadmap-search" className={`text-sm font-black ${light ? "text-slate-900" : "text-white"}`}>
                Znajdź lekcję lub etap
            </label>
            <div className={`mt-3 flex items-center gap-3 rounded-xl border px-3 focus-within:ring-2 ${light ? "border-slate-300 bg-white focus-within:border-teal-700 focus-within:ring-teal-700/15" : "border-white/15 bg-slate-950 focus-within:border-cyan-300 focus-within:ring-cyan-300/20"}`}>
                <BsSearch aria-hidden="true" className={`shrink-0 ${light ? "text-teal-800" : "text-cyan-300"}`} />
                <input
                    ref={input}
                    id="course-roadmap-search"
                    type="search"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={120}
                    value={query}
                    onChange={event => onChange(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === "Escape") {
                            event.preventDefault();
                            clear();
                        }
                    }}
                    aria-describedby="course-roadmap-search-help course-roadmap-search-status"
                    placeholder="Np. Git, zapytania SQL lub etap 117"
                    className={`min-w-0 flex-1 appearance-none bg-transparent py-3 text-base outline-none placeholder:text-slate-500 [&::-webkit-search-cancel-button]:appearance-none ${light ? "text-slate-900 caret-teal-800" : "text-white"}`}
                />
                {query && <button
                    type="button"
                    aria-label="Wyczyść wyszukiwanie w kursie"
                    onClick={clear}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition focus-visible:outline-2 ${light ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-teal-700" : "text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-cyan-300"}`}
                >
                    <BsX aria-hidden="true" className="text-xl" />
                </button>}
            </div>
            <p id="course-roadmap-search-help" className={`mt-3 text-xs leading-5 ${light ? "text-slate-600" : "text-slate-400"}`}>
                Szukaj po nazwie lekcji, etapu lub części — także bez polskich znaków. Numer etapu wpisz np. „etap 117”.
            </p>
            <p id="course-roadmap-search-status" role="status" aria-live="polite" aria-atomic="true" className={`mt-2 text-xs font-bold leading-5 ${light ? "text-teal-800" : "text-cyan-200"}`}>
                {active
                    ? moduleCount > 0
                        ? `Znalezione etapy: ${moduleCount} · Lekcje w wynikach: ${lessonCount}. Wyniki rozwinięto automatycznie. Blokady lekcji pozostają bez zmian.`
                        : "Brak wyników. Sprawdź nazwę, wpisz krótsze hasło lub wyczyść wyszukiwanie."
                    : "Wyszukiwanie nie zmienia postępu nauki. Po wyczyszczeniu wrócisz do poprzedniego układu części i etapów."}
            </p>
        </form>
    );
}
