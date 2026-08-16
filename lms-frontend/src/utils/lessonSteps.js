const ASSESSMENT_TYPES = new Set(["TASK", "QUIZ"]);

export function isAssessmentStep(step) {
    return ASSESSMENT_TYPES.has(step?.type);
}

export function isPersistentlyCompletedStep(step) {
    return isAssessmentStep(step) && Boolean(step?.correct);
}

export function canAccessLessonStep(steps, targetIndex) {
    if (targetIndex <= 0) return true;

    return steps.slice(0, targetIndex).every(step => (
        !isAssessmentStep(step) || isPersistentlyCompletedStep(step)
    ));
}

export function getActiveLessonStepIndex(steps, lessonCompleted = false) {
    if (!steps.length || lessonCompleted) return -1;

    const assessmentIndexes = steps
        .map((step, index) => isAssessmentStep(step) ? index : -1)
        .filter(index => index >= 0);

    if (!assessmentIndexes.length) return 0;

    let lastCompletedAssessmentIndex = -1;

    for (const index of assessmentIndexes) {
        if (!isPersistentlyCompletedStep(steps[index])) break;
        lastCompletedAssessmentIndex = index;
    }

    if (lastCompletedAssessmentIndex < 0) return 0;

    const allAssessmentsCompleted = assessmentIndexes.every(index => (
        isPersistentlyCompletedStep(steps[index])
    ));

    if (allAssessmentsCompleted) return steps.length;

    return Math.min(lastCompletedAssessmentIndex + 1, steps.length - 1);
}

export function isLessonStepCompleted(
    steps,
    index,
    lessonCompleted = false
) {
    if (lessonCompleted) return true;

    const step = steps[index];
    if (isAssessmentStep(step)) return isPersistentlyCompletedStep(step);

    const activeIndex = getActiveLessonStepIndex(steps, lessonCompleted);
    return activeIndex >= 0 && index < activeIndex;
}
