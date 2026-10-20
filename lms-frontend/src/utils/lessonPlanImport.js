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
    const seenStageNames = new Set();
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
            if (currentStage.stageTitle.length > 255) errors.push(`Nazwa etapu ${stageNumber} ma więcej niż 255 znaków.`);
            const nameKey = normalizePlanTitle(currentStage.stageTitle);
            if (nameKey && seenStageNames.has(nameKey)) errors.push(`Nazwa etapu „${currentStage.stageTitle}” występuje w planie więcej niż raz.`);
            if (nameKey) seenStageNames.add(nameKey);
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
            if (title.length > 255) errors.push(`Etap ${stage.stageNumber}: tytuł lekcji „${title.slice(0, 60)}…” ma więcej niż 255 znaków.`);
            const key = normalizePlanTitle(title);
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

export function normalizePlanTitle(value) {
    return String(value || "").normalize("NFKC").replace(/`/g, " ")
        .replace(/[‘’]/g, "'").replace(/[–—−]/g, "-")
        .replace(/\s*-\s*/g, " - ").replace(/\s+/g, " ").trim().toLocaleLowerCase("pl-PL");
}

export function previewLessonPlan(stages, existingModules = []) {
    let stagesToCreate = 0, stagesToReuse = 0;
    const errors = [];
    for (const stage of stages) {
        const key = normalizePlanTitle(stage.stageTitle);
        if (!key) {
            if (stage.stageNumber <= existingModules.length) stagesToReuse++;
            else errors.push(`Podaj nazwę nowego etapu ${stage.stageNumber} po znaku „—”.`);
            continue;
        }
        const matches = existingModules.filter(module => normalizePlanTitle(module.name) === key);
        if (matches.length > 1 && !matches.some(module => module.id === existingModules[stage.stageNumber - 1]?.id)) {
            errors.push(`Nazwa „${stage.stageTitle}” pasuje do kilku etapów. Nadaj im różne nazwy przed importem.`);
        } else if (matches.length) stagesToReuse++;
        else stagesToCreate++;
    }
    return { stagesToCreate, stagesToReuse, errors };
}

// The complete plan has no size cap. Keep individual transactions bounded,
// including when one stage alone contains more than a batch of lesson titles.
export function buildLessonPlanBatches(stages) {
    const batches = [];
    let current = [], lessonCount = 0;
    const flush = () => {
        if (current.length) batches.push(current);
        current = []; lessonCount = 0;
    };
    for (const stage of [...stages].sort((a, b) => a.stageNumber - b.stageNumber)) {
        let offset = 0;
        while (offset < stage.lessonTitles.length) {
            if (current.length === 20 || lessonCount === 500 || current.some(item => item.stageNumber === stage.stageNumber)) flush();
            const take = Math.min(stage.lessonTitles.length - offset, 500 - lessonCount);
            current.push({ ...stage, lessonTitles: stage.lessonTitles.slice(offset, offset + take) });
            lessonCount += take; offset += take;
        }
    }
    flush();
    return batches;
}
