export const JAVA_COURSE_PATH = "/kurs/java-backend-developer";
export const JAVA_COURSE_DESCRIPTION = "Ucz się Javy krok po kroku: poznawaj pojęcia, pisz własny kod i poprawiaj rozwiązania na podstawie wskazówek. Java Backend Developer w EduHub łączy uporządkowany plan nauki z ćwiczeniami w edytorze i zapisem Twojego postępu.";

export function isJavaBackendCourse(course) {
    const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return [course?.name, course?.title].some(value => normalize(value) === "javabackenddeveloper");
}

export function getCourseDescription(course) {
    const description = course?.description?.trim();
    return description && !/^Opis kursu zostanie uzupełniony wkrótce\.?$/i.test(description)
        ? description
        : isJavaBackendCourse(course) ? JAVA_COURSE_DESCRIPTION : "Opis kursu zostanie uzupełniony wkrótce.";
}

export function getPublicOfferPlans(offer) {
    if (!offer) return [];
    const plans = [];
    const add = (id, title, amount, renewal) => {
        const price = Number(amount);
        if (Number.isFinite(price) && price > 0) plans.push({ id, title, price, renewal });
    };
    if (offer.billingMode === "FREE") return [{ id: "FREE", title: "Bezpłatny dostęp", price: 0, renewal: "Bez opłat za dostęp do kursu." }];
    if (["ONE_TIME", "FLEXIBLE"].includes(offer.billingMode)) add("ONE_TIME", "Dostęp bezterminowy", offer.price, "Jednorazowa płatność.");
    if (offer.billingMode === "MONTHLY_OPTIONS") add("THIRTY_DAYS", "30 dni bez odnowienia", offer.price, "Jednorazowa płatność za 30 dni dostępu.");
    if (["SUBSCRIPTION", "FLEXIBLE", "MONTHLY_OPTIONS"].includes(offer.billingMode)) add("SUBSCRIPTION", "Abonament miesięczny", offer.monthlyPrice, "Odnawia się automatycznie co miesiąc.");
    return plans;
}

export function formatOfferPrice(price) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: price % 1 === 0 ? 0 : 2 }).format(price);
}
