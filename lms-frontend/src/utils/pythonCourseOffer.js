export const PYTHON_COURSE_SLUG = "python-ai-automatyzacje-dla-biznesu";
export const PYTHON_COURSE_PATH = `/kurs/${PYTHON_COURSE_SLUG}`;
export const PYTHON_COURSE_NAME = "Python + AI — automatyzacje dla biznesu";
export const PYTHON_COURSE_DESCRIPTION = "Poznaj Pythona i AI w kontekście automatyzacji dla biznesu. Ucz się krok po kroku, pracuj z materiałami i zadaniami, a do kolejnych lekcji wracaj we własnym tempie. Sprawdź program i wybierz tematy przydatne w Twojej pracy.";

// Match this offer, not every Python course. Keep punctuation consistent with
// the three title variants accepted by the public API.
export function isPythonAutomationCourse(course) {
    const titles = ["-", "—", "–"].map(dash => `python + ai ${dash} automatyzacje dla biznesu`);
    return [course?.name, course?.title].some(value => titles.includes(String(value || "").trim().toLowerCase()));
}
