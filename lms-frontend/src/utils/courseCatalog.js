export function courseProgress(course) {
    const value = Number(course?.progress ?? 0);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

export function isPaidCourse(course) {
    if (typeof course?.paid === "boolean") return course.paid;
    if (course?.billingMode) return course.billingMode !== "FREE";
    return Number(course?.price || 0) > 0 || Number(course?.monthlyPrice || 0) > 0;
}

function formatPrice(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("pl-PL", {
        style: "currency", currency: "PLN", maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
}

export function formatCoursePrice(course) {
    if (!isPaidCourse(course)) return "Bezpłatnie";
    if (course.billingMode === "SUBSCRIPTION") return `${formatPrice(course.monthlyPrice)} / mies.`;
    if (["FLEXIBLE", "MONTHLY_OPTIONS"].includes(course.billingMode)) {
        const prices = [course.price, course.monthlyPrice].map(Number).filter(value => value > 0);
        return `od ${formatPrice(prices.length ? Math.min(...prices) : 0)}`;
    }
    return formatPrice(course.price);
}

export function courseBillingLabel(course) {
    if (!isPaidCourse(course)) return "Dostęp bez opłat";
    return {
        SUBSCRIPTION: "Abonament miesięczny",
        FLEXIBLE: "Jednorazowo lub abonament",
        MONTHLY_OPTIONS: "30 dni lub abonament"
    }[course.billingMode] || "Płatność jednorazowa";
}

function normalizeCourseName(value) {
    return String(value ?? "").normalize("NFKD").replace(/\p{M}/gu, "")
        .replace(/[łŁ]/g, "l").toLocaleLowerCase("pl").replace(/\s+/g, " ").trim();
}

export function filterCoursesByName(courses, query) {
    const tokens = normalizeCourseName(query).split(" ").filter(Boolean);
    return (courses ?? []).filter(course => {
        const name = normalizeCourseName(`${course.title || ""} ${course.name || ""}`);
        return tokens.every(token => name.includes(token));
    });
}

export function sortCoursesForLearning(courses) {
    const priority = course => {
        const progress = courseProgress(course);
        return progress > 0 && progress < 100 ? 0 : progress === 0 ? 1 : 2;
    };
    return [...(courses ?? [])].sort((first, second) => (
        Number(Boolean(second.canAccess)) - Number(Boolean(first.canAccess))
        || priority(first) - priority(second)
        || courseProgress(second) - courseProgress(first)
        || Number(second.lessonCount || 0) - Number(first.lessonCount || 0)
    ));
}
