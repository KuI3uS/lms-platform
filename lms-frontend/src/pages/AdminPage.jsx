import { useLocale } from "../context/LocaleContext.jsx";
import { Link } from "react-router-dom";
import {
    BsPeopleFill,
    BsBookHalf,
    BsCollectionPlay,
    BsClipboardCheck,
    BsBarChartFill,
    BsGearFill,
    BsKey
} from "react-icons/bs";

import WorkspacePageHeader from "../components/WorkspacePageHeader";

const cards = [

    {
        title: "Użytkownicy",
        description: "Zarządzaj kontami użytkowników, rolami oraz dostępami.",
        icon: <BsPeopleFill size={22} />,
        to: "/admin/users"
    },

    {
        title: "Kursy",
        description: "Twórz nowe kursy oraz zarządzaj istniejącymi.",
        icon: <BsBookHalf size={22} />,
        to: "/admin/courses"
    },

    {
        title: "Moduły",
        description: "Dodawaj moduły oraz organizuj strukturę kursów.",
        icon: <BsCollectionPlay size={22} />,
        to: "/admin/modules"
    },

    {
        title: "Quizy",
        description: "Twórz pytania, odpowiedzi i testy dla uczniów.",
        icon: <BsClipboardCheck size={22} />,
        to: "/admin/questions"
    },

    {
        title: "Statystyki",
        description: "Śledź postępy użytkowników i aktywność platformy.",
        icon: <BsBarChartFill size={22} />,
        to: "/admin/statistics"
    },

    {
        title: "Kody dostępu",
        description: "Generuj jednorazowe kody odblokowujące kurs na 30 dni lub bezterminowo.",
        icon: <BsKey size={22} />,
        to: "/admin/access-codes"
    },

    {
        title: "Ustawienia",
        description: "Konfiguracja platformy oraz parametrów systemu.",
        icon: <BsGearFill size={22} />,
        to: "/admin/settings"
    }

];

export default function AdminPage() {
    const { t } = useLocale();

    return <div className="product-page">
        <WorkspacePageHeader title={t("Panel twórcy")} description={t("Zarządzaj kursami, lekcjami, użytkownikami oraz całą platformą z jednego miejsca.")}
            actions={<Link to="/admin/add-course" className="product-button product-button-primary">{t("Dodaj kurs")}</Link>} />
        <div className="product-admin-grid">{cards.map(card => <Link key={card.title} to={card.to} className="product-panel product-admin-link"><span className="product-admin-icon" aria-hidden="true">{card.icon}</span><div><h2>{t(card.title)}</h2><p>{t(card.description)}</p></div></Link>)}</div>
    </div>;
}
