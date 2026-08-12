import { useId } from "react";

const LEAGUES = {
    Miedź: { primary: "#fb923c", light: "#fed7aa", dark: "#7c2d12", shape: "copper" },
    Srebro: { primary: "#e2e8f0", light: "#ffffff", dark: "#475569", shape: "silver" },
    Złoto: { primary: "#facc15", light: "#fef08a", dark: "#a16207", shape: "gold" },
    Platyna: { primary: "#22d3ee", light: "#cffafe", dark: "#155e75", shape: "platinum" },
    Kryształ: { primary: "#a78bfa", light: "#ede9fe", dark: "#5b21b6", shape: "crystal" },
    Diament: { primary: "#38bdf8", light: "#e0f2fe", dark: "#075985", shape: "diamond" },
    Pryzmat: { primary: "#f472b6", light: "#fdf2f8", dark: "#7e22ce", shape: "prism" }
};

const SIZES = {
    xs: "h-9 w-9",
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-28 w-28",
    xl: "h-40 w-40"
};

export default function LeagueBadge({ name = "Miedź", size = "md", muted = false, className = "" }) {
    const config = LEAGUES[name] || LEAGUES.Miedź;
    const rawId = useId().replace(/:/g, "");
    const mainGradient = `league-main-${rawId}`;
    const rimGradient = `league-rim-${rawId}`;
    const shineGradient = `league-shine-${rawId}`;

    return (
        <span
            role="img"
            aria-label={`Odznaka ligi ${name}`}
            className={`relative inline-grid shrink-0 place-items-center ${SIZES[size] || SIZES.md} ${className}`}
            style={{ filter: muted ? "grayscale(0.75) saturate(0.45)" : `drop-shadow(0 8px 12px ${config.dark}55)` }}
        >
            <svg viewBox="0 0 100 108" className="h-full w-full overflow-visible" aria-hidden="true">
                <defs>
                    <linearGradient id={mainGradient} x1="20" y1="10" x2="80" y2="96" gradientUnits="userSpaceOnUse">
                        <stop stopColor={config.light} />
                        <stop offset="0.42" stopColor={config.primary} />
                        <stop offset="1" stopColor={config.dark} />
                    </linearGradient>
                    <linearGradient id={rimGradient} x1="18" y1="10" x2="83" y2="99" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" stopOpacity="0.8" />
                        <stop offset="0.25" stopColor={config.primary} />
                        <stop offset="1" stopColor={config.dark} />
                    </linearGradient>
                    <linearGradient id={shineGradient} x1="28" y1="25" x2="73" y2="82" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
                    </linearGradient>
                </defs>

                <path d="M50 3 86 17 96 53 78 91 50 105 22 91 4 53 14 17Z" fill={config.dark} opacity="0.65" transform="translate(0 2)" />
                <path d="M50 2 86 16 96 51 78 89 50 102 22 89 4 51 14 16Z" fill={`url(#${rimGradient})`} />
                <path d="M50 10 79 21 87 51 71 81 50 92 29 81 13 51 21 21Z" fill={`url(#${mainGradient})`} stroke="#fff" strokeOpacity="0.28" strokeWidth="2" />
                <path d="M22 25 50 14 77 24 68 31 50 25 31 32Z" fill={`url(#${shineGradient})`} opacity="0.65" />
                <LeagueGlyph shape={config.shape} gradient={shineGradient} dark={config.dark} primary={config.primary} />
                <circle cx="25" cy="29" r="4" fill="#fff" opacity="0.72" />
                <circle cx="32" cy="24" r="2" fill="#fff" opacity="0.4" />
            </svg>
        </span>
    );
}

function LeagueGlyph({ shape, gradient, dark, primary }) {
    if (shape === "silver") {
        return <path d="M50 27 68 48 60 74 50 82 40 74 32 48Z" fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round" />;
    }
    if (shape === "gold") {
        return (
            <g>
                <path d="m31 45 10 5 9-22 9 22 11-5-5 30H36Z" fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round" />
                <circle cx="50" cy="61" r="6" fill={primary} stroke={dark} strokeWidth="2" />
            </g>
        );
    }
    if (shape === "platinum") {
        return <path d="m50 24 8 21 22 8-22 8-8 22-8-22-22-8 22-8Z" fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round" />;
    }
    if (shape === "crystal") {
        return (
            <g fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round">
                <path d="m50 25 12 17-4 36H42l-4-36Z" />
                <path d="m36 43-12 15 15 20 5-31Z" />
                <path d="m64 43 12 15-15 20-5-31Z" />
            </g>
        );
    }
    if (shape === "diamond") {
        return (
            <g stroke={dark} strokeWidth="2.5" strokeLinejoin="round">
                <path d="M30 44 40 29h20l10 15-20 36Z" fill={`url(#${gradient})`} />
                <path d="m30 44 20 8 20-8M40 29l10 23 10-23" fill="none" />
            </g>
        );
    }
    if (shape === "prism") {
        return (
            <g>
                <path d="m50 22 8 20 21-7-10 19 17 13-22 2-1 22-13-18-13 18-1-22-22-2 17-13-10-19 21 7Z" fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round" />
                <circle cx="50" cy="56" r="9" fill={primary} stroke="#fff" strokeOpacity="0.65" strokeWidth="3" />
            </g>
        );
    }
    return (
        <g fill={`url(#${gradient})`} stroke={dark} strokeWidth="3" strokeLinejoin="round">
            <path d="M50 23 68 43 61 79H39l-7-36Z" />
            <path d="m32 43 18 9 18-9M50 23v29L39 79" fill="none" />
        </g>
    );
}
