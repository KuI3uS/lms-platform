export const MAX_LESSON_BLOCKS = 10;
export const MAX_LANGUAGE_LESSON_BLOCKS = 20;

export function getLessonBlockLimit(variant = "PROGRAMMING") {
    return variant === "LANGUAGE"
        ? MAX_LANGUAGE_LESSON_BLOCKS
        : MAX_LESSON_BLOCKS;
}
