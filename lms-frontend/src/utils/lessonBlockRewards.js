export const DEFAULT_EXERCISE_XP = 10;

export const REWARDED_BLOCK_TYPES = new Set([
    "TASK", "PRACTICAL_LAB", "DEBUGGING", "PREDICT_OUTPUT", "CODE_REVIEW", "OPEN_RESPONSE",
    "QUIZ", "AUDIO", "DIALOG", "VOCABULARY", "WORD_LAB", "LISTENING", "SENTENCE_BUILDER"
]);

export const ASSESSMENT_BLOCK_TYPES = REWARDED_BLOCK_TYPES;

export function getBlockBaseXp(block) {
    if (!REWARDED_BLOCK_TYPES.has(block.type)) return 0;
    const points = Number(block.points);
    return Number.isFinite(points) && points > 0
        ? Math.min(Math.trunc(points), 1000)
        : DEFAULT_EXERCISE_XP;
}
