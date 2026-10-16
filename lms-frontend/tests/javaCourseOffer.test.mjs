import test from "node:test";
import assert from "node:assert/strict";
import { getCourseDescription, getPublicOfferPlans, isJavaBackendCourse, JAVA_COURSE_DESCRIPTION } from "../src/utils/javaCourseOffer.js";
import { clearCoursePurchase, purchaseCourseId, rememberedCoursePurchase, rememberCoursePurchase, safeLoginDestination } from "../src/utils/coursePurchaseIntent.js";

test("Java's empty description is replaced without changing other courses or an authored description", () => {
    assert.equal(getCourseDescription({ title: "Java Backend Developer" }), JAVA_COURSE_DESCRIPTION);
    assert.equal(getCourseDescription({ name: "Java Backend Developer", description: "Opis kursu zostanie uzupełniony wkrótce." }), JAVA_COURSE_DESCRIPTION);
    assert.equal(getCourseDescription({ name: "Java Backend Developer", description: "Własny opis" }), "Własny opis");
    assert.equal(isJavaBackendCourse({ title: "JavaScript Backend Developer" }), false);
    assert.notEqual(getCourseDescription({ name: "SQL" }), JAVA_COURSE_DESCRIPTION);
});

test("offer plans use actual configured amounts and distinguish renewal from one-off access", () => {
    assert.deepEqual(getPublicOfferPlans(null), []);
    assert.deepEqual(getPublicOfferPlans({ billingMode: "SUBSCRIPTION", monthlyPrice: "89.00", price: 500 }).map(plan => [plan.id, plan.price]), [["SUBSCRIPTION", 89]]);
    assert.deepEqual(getPublicOfferPlans({ billingMode: "MONTHLY_OPTIONS", monthlyPrice: 89, price: 99 }).map(plan => [plan.id, plan.price]), [["THIRTY_DAYS", 99], ["SUBSCRIPTION", 89]]);
    assert.deepEqual(getPublicOfferPlans({ billingMode: "FLEXIBLE", monthlyPrice: 89, price: 799 }).map(plan => plan.id), ["ONE_TIME", "SUBSCRIPTION"]);
    assert.deepEqual(getPublicOfferPlans({ billingMode: "ONE_TIME", price: null }), []);
    assert.deepEqual(getPublicOfferPlans({ billingMode: "SUBSCRIPTION", monthlyPrice: -1 }), []);
    assert.equal(getPublicOfferPlans({ billingMode: "FREE" })[0].price, 0);
});

test("purchase links accept only positive numeric course identifiers", () => {
    assert.equal(purchaseCourseId("?course=42&utm_source=post"), "42");
    for (const value of ["//evil.invalid", "-1", "0", "1/2", "1%0A", "https://evil.invalid"]) {
        assert.equal(purchaseCourseId(`?course=${value}`), null);
    }
    assert.equal(safeLoginDestination("?course=42", "/modules/1"), "/checkout/42");
    assert.equal(safeLoginDestination("", "/modules/1"), "/modules/1");
});

test("email verification in a second tab can recover a short-lived purchase intention safely", () => {
    const data = new Map();
    const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
    rememberCoursePurchase(42, storage);
    assert.equal(rememberedCoursePurchase(storage), "42");
    assert.equal(safeLoginDestination("", null, storage), "/checkout/42");
    clearCoursePurchase(storage);
    assert.equal(safeLoginDestination("", null, storage), "/courses");
    for (const raw of ["not-json", '{"id":"//evil.invalid","expiresAt":9999999999999}', '{"id":"42","expiresAt":0}']) {
        data.set("eduhub:course-purchase-intent", raw);
        assert.equal(rememberedCoursePurchase(storage), null);
    }
    for (const path of ["//evil.invalid", "/\\evil.invalid", "https://evil.invalid"]) {
        assert.equal(safeLoginDestination("", path, storage), "/courses");
    }
});
