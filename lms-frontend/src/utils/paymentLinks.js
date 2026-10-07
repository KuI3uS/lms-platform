export const JAVA_COURSE_PAYMENT_URL =
    "https://checkout.revolut.com/pay/842437f5-b5f9-4efe-a160-ee0e4b6b53b2";

export function getDefaultCoursePaymentUrl(course) {
    const courseName = `${course?.name || ""} ${course?.title || ""}`.toLowerCase();
    const price = Number(course?.price || 0);

    if (courseName.includes("java") && price === 1000) {
        return JAVA_COURSE_PAYMENT_URL;
    }

    return "";
}

export function resolveCoursePaymentUrl(course, order) {
    if (order && Number(order.discountAmount || 0) > 0) {
        return "";
    }
    return order?.paymentUrl || course?.paymentUrl || getDefaultCoursePaymentUrl(course);
}
