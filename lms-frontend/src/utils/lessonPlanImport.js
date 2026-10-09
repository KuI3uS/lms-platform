const STAGE_HEADER = /^\s*#{0,6}\s*ETAP\s+(\d+)\s*(?:[—–-]\s*(.*?))?\s*$/i;
const LESSONS_LINE = /^\s*(?:\*\*)?Lekcje(?:\*\*)?\s*:\s*(.*?)\s*$/i;
const CONTENT_REFERENCE = /:chatgpt-content-reference\{[^}]*\}/gi;

function cleanText(value) {
    return String(value || "")
        .replace(CONTENT_REFERENCE, "")
        .replace(/&#x20;/gi, " ")
        .trim();
}

function cleanLessonTitle(value) {
    return cleanText(value)
        .replace(/^[-*]\s+/, "")
        .replace(/^\*\*(.*?)\*\*$/, "$1")
        .replace(/\.$/, "")
        .trim();
}

export function parseLessonPlan(source) {
    const stages = [];
    const errors = [];
    const seenStageNumbers = new Set();
    let currentStage = null;

    for (const rawLine of String(source || "").split(/\r?\n/)) {
        const line = cleanText(rawLine);
        if (!line) continue;

        const stageMatch = line.match(STAGE_HEADER);
        if (stageMatch) {
            const stageNumber = Number(stageMatch[1]);
            if (!Number.isSafeInteger(stageNumber) || stageNumber < 1) {
                errors.push(`Nieprawidłowy numer etapu: ${stageMatch[1]}`);
                currentStage = null;
                continue;
            }
            if (seenStageNumbers.has(stageNumber)) {
                errors.push(`Etap ${stageNumber} występuje w planie więcej niż raz.`);
            }
            seenStageNumbers.add(stageNumber);
            currentStage = {
                stageNumber,
                stageTitle: cleanText(stageMatch[2]),
                lessonTitles: []
            };
            stages.push(currentStage);
            continue;
        }

        const lessonsMatch = line.match(LESSONS_LINE);
        if (!lessonsMatch || !currentStage) continue;

        currentStage.lessonTitles.push(
            ...lessonsMatch[1]
                .split(";")
                .map(cleanLessonTitle)
                .filter(Boolean)
        );
    }

    for (const stage of stages) {
        const uniqueTitles = [];
        const seenTitles = new Set();
        for (const title of stage.lessonTitles) {
            const key = title.toLocaleLowerCase("pl-PL").replace(/\s+/g, " ");
            if (seenTitles.has(key)) continue;
            seenTitles.add(key);
            uniqueTitles.push(title);
        }
        stage.lessonTitles = uniqueTitles;
        if (stage.lessonTitles.length === 0) {
            errors.push(`Etap ${stage.stageNumber} nie zawiera listy „Lekcje: ...”.`);
        }
    }

    return {
        stages,
        errors,
        lessonCount: stages.reduce(
            (sum, stage) => sum + stage.lessonTitles.length,
            0
        )
    };
}
