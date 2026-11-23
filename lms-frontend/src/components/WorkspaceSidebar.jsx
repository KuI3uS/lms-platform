import { Link, NavLink, useLocation } from "react-router-dom";
import { BsGrid1X2, BsBook, BsAward, BsArrowRepeat, BsClipboardCheck, BsBarChart, BsKey, BsShieldLock, BsPeople, BsPlusCircle, BsInbox, BsCreditCard, BsCalendarCheck, BsLifePreserver, BsX, BsChevronDown } from "react-icons/bs";
import { useLocale } from "../context/LocaleContext";
import { SUPPORT_EMAIL } from "../utils/support";
import skicodeLogo from "../assets/images/skicode-logo.png";

const LEARNING = [
    ["/dashboard", "Moja nauka", BsGrid1X2],
    ["/courses", "Kursy", BsBook],
    ["/learning-center", "Postęp i nagrody", BsAward],
    ["/language-reviews", "Powtórki językowe", BsArrowRepeat]
];
const PRACTICE = [
    ["/exams", "Egzaminy INF", BsClipboardCheck],
    ["/results", "Wyniki testów", BsBarChart],
    ["/access-code", "Kod dostępu", BsKey]
];
const CREATOR = [
    ["/admin", "Panel twórcy", BsShieldLock],
    ["/admin/users", "Użytkownicy", BsPeople],
    ["/admin/add-course", "Dodaj kurs", BsPlusCircle],
    ["/admin/submissions", "Prace uczniów", BsInbox],
    ["/admin/course-orders", "Zamówienia kursów", BsCreditCard],
    ["/admin/access-codes", "Kody dostępu", BsKey],
    ["/admin/tutoring", "Korepetycje", BsCalendarCheck]
];

export default function WorkspaceSidebar({ role, onClose }) {
    const { t } = useLocale();
    const { pathname } = useLocation();
    const items = group => group.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === "/admin"} onClick={onClose}
        className={({ isActive }) => `product-nav-link${isActive || to === "/courses" && /^\/(modules|lessons)\//.test(pathname) ? " is-active" : ""}`}>
        <Icon aria-hidden="true" /><span>{t(label)}</span>
    </NavLink>);

    return <>
        <div className="product-sidebar-brand">
            <Link to="/dashboard" onClick={onClose} className="product-brand" aria-label={t("EduHub — moja nauka")}>
                <img src={skicodeLogo} alt="" /><span>edu<strong>hub</strong><i aria-hidden="true">.</i><small>{t("Twoja przestrzeń nauki")}</small></span>
            </Link>
            <button type="button" aria-label={t("Zamknij menu")} onClick={onClose} className="product-sidebar-close lg:hidden"><BsX aria-hidden="true" /></button>
        </div>
        <nav aria-label={t("Nawigacja aplikacji")} className="product-sidebar-nav">
            <div className="product-nav-section"><p className="product-nav-label">{t("Nauka")}</p>{items(LEARNING)}</div>
            <div className="product-nav-section"><p className="product-nav-label">{t("Sprawdź się")}</p>{items(PRACTICE)}</div>
            {role === "ADMIN" && <details className="product-creator-nav" open={pathname.startsWith("/admin") || undefined}>
                <summary>{t("Zarządzanie platformą")}<BsChevronDown aria-hidden="true" /></summary>
                <div>{items(CREATOR)}</div>
            </details>}
        </nav>
        <div className="product-sidebar-help"><Link to="/pomoc" onClick={onClose}><BsLifePreserver aria-hidden="true" /><span>{t("Pomoc i kontakt")}<small>{SUPPORT_EMAIL}</small></span></Link></div>
    </>;
}
