const REFERENCE_MARKER = /\\*:chatgpt-content-reference\{[^{}\r\n]*\}|\\*:contentReference\[[^[\]\r\n]*\]\{[^{}\r\n]*\}/gi;

export function cleanChatGptText(value) {
    return String(value ?? "").replace(REFERENCE_MARKER, "");
}

export function cleanChatGptBlock(block) {
    if (!block) return block;
    return Object.fromEntries(Object.entries(block).map(([key, value]) => [
        key,
        typeof value === "string" ? cleanChatGptText(value) : value
    ]));
}
