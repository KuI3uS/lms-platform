package com.twojlogin.lms.entity;

public enum CourseBillingMode {
    FREE,
    ONE_TIME,
    SUBSCRIPTION,
    FLEXIBLE,
    MONTHLY_OPTIONS;

    public boolean allowsOneTime() {
        return this == ONE_TIME || this == FLEXIBLE;
    }

    public boolean allowsSubscription() {
        return this == SUBSCRIPTION || this == FLEXIBLE || this == MONTHLY_OPTIONS;
    }

    public boolean allowsThirtyDays() {
        return this == MONTHLY_OPTIONS;
    }
}
