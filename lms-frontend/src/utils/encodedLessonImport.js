const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;

// Course code is an authoring document. Preserve its UTF-8 bytes in transit.
export function encodeLessonImport(document) {
    const bytes = new TextEncoder().encode(JSON.stringify(document));
    if (bytes.length > MAX_DOCUMENT_BYTES) {
        throw new Error("Paczka przekracza 3 MB. Podziel materiał na mniejsze paczki kompletnych lekcji.");
    }
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += 32768) {
        chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
    }
    return { encoding: "base64-utf8", payload: btoa(chunks.join("")) };
}
