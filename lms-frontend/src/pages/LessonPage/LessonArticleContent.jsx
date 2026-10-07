const BULLET_PATTERN = /^[-*•]\s+(.+)$/;
const ORDERED_PATTERN = /^(\d+)[.)]\s+(.+)$/;
const HEADING_PATTERN = /^(#{1,3})\s+(.+)$/;
const DEFINITION_PATTERN = /^([^:]{2,48}):\s+(.+)$/;

function cleanLine(line) {
    return line.trim();
}

function isImplicitListItem(line) {
    const value = cleanLine(line);

    return value.length > 0
        && value.length <= 72
        && !value.endsWith(":")
        && !DEFINITION_PATTERN.test(value)
        && !HEADING_PATTERN.test(value);
}

function parseLessonContent(content = "") {
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    const sections = [];
    let paragraph = [];

    function flushParagraph() {
        if (!paragraph.length) return;

        sections.push({
            type: "paragraph",
            text: paragraph.join(" ").replace(/\s+/g, " ").trim()
        });
        paragraph = [];
    }

    for (let index = 0; index < lines.length;) {
        const line = cleanLine(lines[index]);

        if (!line) {
            flushParagraph();
            index += 1;
            continue;
        }

        const heading = line.match(HEADING_PATTERN);
        if (heading) {
            flushParagraph();
            sections.push({
                type: "heading",
                level: heading[1].length,
                text: heading[2]
            });
            index += 1;
            continue;
        }

        const bullet = line.match(BULLET_PATTERN);
        const ordered = line.match(ORDERED_PATTERN);
        if (bullet || ordered) {
            flushParagraph();
            const listType = ordered ? "ordered-list" : "list";
            const items = [];

            while (index < lines.length) {
                const candidate = cleanLine(lines[index]);
                const match = listType === "ordered-list"
                    ? candidate.match(ORDERED_PATTERN)
                    : candidate.match(BULLET_PATTERN);

                if (!match) break;
                items.push(listType === "ordered-list" ? match[2] : match[1]);
                index += 1;
            }

            sections.push({ type: listType, items });
            continue;
        }

        const definition = line.match(DEFINITION_PATTERN);
        if (definition) {
            const definitions = [];
            let cursor = index;

            while (cursor < lines.length) {
                const match = cleanLine(lines[cursor]).match(DEFINITION_PATTERN);
                if (!match) break;

                definitions.push({
                    term: match[1].trim(),
                    description: match[2].trim()
                });
                cursor += 1;
            }

            if (definitions.length >= 2) {
                flushParagraph();
                sections.push({ type: "definitions", items: definitions });
                index = cursor;
                continue;
            }
        }

        if (line.endsWith(":")) {
            flushParagraph();
            sections.push({
                type: "lead",
                text: line
            });

            const items = [];
            let cursor = index + 1;

            while (
                cursor < lines.length
                && isImplicitListItem(lines[cursor])
            ) {
                items.push(cleanLine(lines[cursor]).replace(/[;,]$/, ""));
                cursor += 1;
            }

            if (items.length >= 2) {
                sections.push({ type: "list", items });
                index = cursor;
            } else {
                index += 1;
            }
            continue;
        }

        paragraph.push(line);
        if (/[.!?…”"]$/.test(line)) {
            flushParagraph();
        }
        index += 1;
    }

    flushParagraph();
    return sections;
}

function SectionHeading({ section }) {
    const Tag = section.level === 1 ? "h3" : "h4";

    return (
        <Tag className="pt-3 text-xl font-black leading-tight text-white sm:text-2xl">
            {section.text}
        </Tag>
    );
}

export default function LessonArticleContent({
                                                 content,
                                                 compact = false
                                             }) {
    const sections = parseLessonContent(content);

    if (!sections.length) {
        return <p className="text-gray-400">Brak treści.</p>;
    }

    return (
        <div className={`max-w-[76ch] ${compact ? "space-y-4" : "space-y-6"}`}>
            {sections.map((section, index) => {
                const key = `${section.type}-${index}`;

                if (section.type === "heading") {
                    return <SectionHeading key={key} section={section} />;
                }

                if (section.type === "lead") {
                    return (
                        <p
                            key={key}
                            className={`${compact ? "text-base leading-7" : "pt-2 text-lg leading-8"} font-bold text-gray-100`}
                        >
                            {section.text}
                        </p>
                    );
                }

                if (section.type === "list" || section.type === "ordered-list") {
                    const ListTag = section.type === "ordered-list" ? "ol" : "ul";

                    return (
                        <ListTag
                            key={key}
                            className={`${compact ? "space-y-2" : "space-y-3 py-1"} list-none`}
                        >
                            {section.items.map((item, itemIndex) => (
                                <li
                                    key={`${item}-${itemIndex}`}
                                    className={`flex items-start ${compact ? "gap-3 text-base leading-7" : "gap-4 text-[1.05rem] leading-8"} text-gray-300`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`shrink-0 ${
                                            section.type === "ordered-list"
                                                ? "grid h-7 w-7 place-items-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-black text-blue-200"
                                                : "mt-[0.65em] h-1.5 w-1.5 rounded-full bg-blue-300"
                                        }`}
                                    >
                                        {section.type === "ordered-list" ? itemIndex + 1 : ""}
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ListTag>
                    );
                }

                if (section.type === "definitions") {
                    return (
                        <dl
                            key={key}
                            className="space-y-4 border-l-2 border-blue-400/25 py-1 pl-5 sm:pl-7"
                        >
                            {section.items.map((item, itemIndex) => (
                                <div key={`${item.term}-${itemIndex}`}>
                                    <dt className="font-black text-gray-100">
                                        {item.term}
                                    </dt>
                                    <dd className={`${compact ? "mt-1 leading-7" : "mt-1.5 text-[1.05rem] leading-8"} text-gray-300`}>
                                        {item.description}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    );
                }

                return (
                    <p
                        key={key}
                        className={`${compact ? "text-base leading-7 sm:text-lg sm:leading-8" : "text-[1.05rem] leading-[1.95] sm:text-lg"} text-gray-300`}
                    >
                        {section.text}
                    </p>
                );
            })}
        </div>
    );
}
