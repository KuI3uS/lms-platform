/** A failed assessment service must not erase an earlier pass or count as a try. */
export function isAssessmentUnavailable(result) {
    return Boolean(result?.evaluationUnavailable || result?.diagnostics?.some(
        diagnostic => String(diagnostic.type || "").startsWith("RUNNER_")
    ));
}
