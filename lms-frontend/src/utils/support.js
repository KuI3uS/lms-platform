export const SUPPORT_EMAIL = "J.Marcinkowski@skicode.pl";

export function supportMailto(topic = "pomoc techniczna") {
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`EduHub — ${topic}`)}`;
}
