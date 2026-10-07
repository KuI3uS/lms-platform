export const DEFAULT_EXERCISE_XP = 10;

export const REWARDED_BLOCK_TYPES = new Set([
    "TASK", "QUIZ", "AUDIO", "DIALOG", "VOCABULARY", "WORD_LAB", "LISTENING", "SENTENCE_BUILDER"
]);

export function getBlockBaseXp(block) {
    if (!REWARDED_BLOCK_TYPES.has(block.type)) return 0;
    const points = Number(block.points);
    return Number.isFinite(points) && points > 0
        ? Math.min(Math.trunc(points), 1000)
        : DEFAULT_EXERCISE_XP;
}
