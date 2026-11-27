function requestIdentifier(body, headers) {
    const fromPage = body.match(/Request ID\s*:?\s*(?:<[^>]*>\s*)*([a-f0-9]{16,64})\b/i)?.[1];
    const fromHeader = headers?.get?.("cf-ray");
    return fromPage || (/^[a-z0-9-]{1,100}$/i.test(fromHeader || "") ? fromHeader : "");
}

export function apiResponseError(response, body) {
    const html = /^\s*(?:<!doctype\s+html|<html|<head|<body)/i.test(body)
        || /text\/html/i.test(response.headers?.get?.("content-type") || "");
    const requestId = requestIdentifier(body, response.headers);
    let message = "Nie udało się wykonać operacji. Spróbuj ponownie.";
    let code = "API_ERROR";

    if (html) {
        const firewall = response.status === 403
            && /web application firewall|<title>\s*Blocked\s*<\/title>/i.test(body);
        code = firewall ? "HOSTING_FIREWALL_BLOCK" : "UNEXPECTED_HTML_RESPONSE";
        message = firewall
            ? "Zabezpieczenia hostingu zablokowały przesłanie danych (403). Zachowaj materiał i spróbuj ponownie po odświeżeniu strony. Jeśli problem się powtórzy, zgłoś go do pomocy EduHub."
            : "Serwer zwrócił stronę błędu zamiast danych. Zachowaj materiał, odśwież stronę i spróbuj ponownie.";
    } else {
        try {
            const parsed = JSON.parse(body);
            const detail = parsed?.message || parsed?.error;
            if (typeof detail === "string" && detail.trim()) message = detail.slice(0, 2000);
        } catch {
            if (body.trim() && !/[<>]/.test(body)) message = body.slice(0, 1000);
        }
    }

    if (html && requestId) message += " Identyfikator zgłoszenia: " + requestId + ".";
    const error = new Error(message);
    error.status = response.status;
    error.code = code;
    if (requestId) error.requestId = requestId;
    return error;
}

export function isImportMaterialError(error) {
    return [400, 409, 422].includes(error?.status)
        && (!error.code || error.code === "API_ERROR");
}
