export const MAX_LESSON_BLOCKS = 10;
export const MAX_LANGUAGE_LESSON_BLOCKS = 10;

/**
 * Zwraca maksymalną liczbę bloków dla danego typu lekcji.
 *
 * PROGRAMMING -> 10
 * LANGUAGE    -> 10
 */
export function getLessonBlockLimit(variant = "PROGRAMMING") {
    const normalizedVariant = String(
        variant || "PROGRAMMING"
    ).toUpperCase();

    return normalizedVariant === "LANGUAGE"
        ? MAX_LANGUAGE_LESSON_BLOCKS
        : MAX_LESSON_BLOCKS;
}
