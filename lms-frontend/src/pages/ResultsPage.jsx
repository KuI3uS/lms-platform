import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import { apiFetch } from "../api/api";
import WorkspacePageHeader from "../components/WorkspacePageHeader";

export default function ResultsPage() {
    const { t } = useLocale();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        apiFetch("/my-results")
            .then(data => { if (active) setResults(Array.isArray(data) ? data : []); })
            .catch(() => { if (active) setError("Nie udało się pobrać wyników."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    const percentage = result => Math.min(100, Math.max(0, Number(result.percentage) || 0));
    const average = results.length ? Math.round(results.reduce((sum, result) => sum + percentage(result), 0) / results.length) : 0;
    const passed = results.filter(result => percentage(result) >= 50).length;
    const best = results.length ? Math.max(...results.map(percentage)) : 0;

    return <div className="product-page">
        <WorkspacePageHeader title={t("Wyniki testów")} description={t("Zobacz, co już opanowano i do których tematów warto wrócić.")}
            actions={<Link to="/courses" className="product-button">{t("Wróć do kursów")}</Link>} />
        {error && <div role="alert" className="product-error"><span>{t(error)}</span><button type="button" onClick={() => { setError(""); setLoading(true); setReload(value => value + 1); }}>{t("Spróbuj ponownie")}</button></div>}
        <dl className="product-summary">
            <div><dt>{t("Zapisane testy")}</dt><dd>{loading || error && !results.length ? "—" : results.length}</dd></div>
            <div><dt>{t("Średni wynik")}</dt><dd>{loading || error && !results.length ? "—" : `${average}%`}</dd></div>
            <div><dt>{t("Najlepszy wynik")}</dt><dd>{loading || error && !results.length ? "—" : `${best}%`}</dd></div>
        </dl>
        <section aria-labelledby="results-history-title">
            <div className="product-section-heading"><h2 id="results-history-title">{t("Historia testów")}</h2>{!loading && !error && results.length > 0 && <span>{t("Zaliczone: {value1} z {value2}", { value1: passed, value2: results.length })}</span>}</div>
            {loading ? <p role="status" className="product-panel p-7 text-sm text-slate-500">{t("Ładowanie wyników…")}</p>
                : error && results.length === 0 ? <div className="product-empty"><h3>{t("Wyniki są chwilowo niedostępne")}</h3><p>{t("Spróbuj ponownie, korzystając z przycisku powyżej.")}</p></div>
                : results.length === 0 ? <div className="product-empty"><h3>{t("Nie masz jeszcze żadnych wyników.")}</h3><p>{t("Po ukończeniu testu w kursie znajdziesz tutaj swój wynik.")}</p><Link to="/courses" className="product-button product-button-primary">{t("Przeglądaj kursy")}</Link></div>
                : <div className="product-panel product-results-table-wrap"><table className="product-results-table"><caption className="sr-only">{t("Historia testów")}</caption><thead><tr><th scope="col">{t("Temat testu")}</th><th scope="col">{t("Wynik")}</th><th scope="col">{t("Status")}</th></tr></thead><tbody>{results.map(result => <tr key={result.id}>
                    <td>{result.module?.name || t("Test")}</td>
                    <td><div className="product-results-score"><strong>{percentage(result)}%</strong><div className="product-progress-track" aria-hidden="true"><span style={{ width: `${percentage(result)}%` }} /></div></div><span className="sr-only product-mobile-outcome">{percentage(result) >= 50 ? t("Zaliczony") : t("Do powtórki")}</span></td>
                    <td><span className={`product-status ${percentage(result) >= 50 ? "product-status-positive" : "product-status-warning"}`}>{percentage(result) >= 50 ? t("Zaliczony") : t("Do powtórki")}</span></td>
                </tr>)}</tbody></table></div>}
        </section>
    </div>;
}
