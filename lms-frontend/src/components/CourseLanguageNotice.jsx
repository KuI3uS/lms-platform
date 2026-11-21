import { useLocale } from "../context/LocaleContext";
import { contentLanguageLabel, contentLanguageOf } from "../utils/courseContentLanguage";

export default function CourseLanguageNotice({ course }) {
    const { language, setLanguage, t } = useLocale();
    if (!course || contentLanguageOf(course) === language) return null;
    return <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">{t("Ten kurs jest w języku: {value1}", { value1: t(contentLanguageLabel(contentLanguageOf(course))) })}</p>
        <p className="mt-2 leading-6">{t("Otwierasz oryginalną wersję kursu. Język interfejsu nie zmienia treści lekcji, odpowiedzi ani dostępu do zakupu.")}</p>
        <button type="button" onClick={() => setLanguage(contentLanguageOf(course))} className="mt-3 rounded-lg border border-amber-400 bg-white px-4 py-2 font-semibold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">{t("Przełącz na język kursu")}</button>
    </aside>;
}
