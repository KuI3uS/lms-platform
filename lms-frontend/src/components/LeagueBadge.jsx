import copperBadge from "../assets/leagues/braz.webp";
import silverBadge from "../assets/leagues/srebro.webp";
import goldBadge from "../assets/leagues/zloto.webp";
import platinumBadge from "../assets/leagues/platyna.webp";
import crystalBadge from "../assets/leagues/krysztal.webp";
import diamondBadge from "../assets/leagues/diament.webp";
import prismBadge from "../assets/leagues/pryzmat.webp";
import legendOneBadge from "../assets/leagues/legenda-i.webp";
import legendTwoBadge from "../assets/leagues/legenda-ii.webp";
import mythicBadge from "../assets/leagues/mityczny.webp";

const LEAGUES = {
    Miedź: { image: copperBadge, glow: "#fb923c" },
    Srebro: { image: silverBadge, glow: "#e2e8f0" },
    Złoto: { image: goldBadge, glow: "#facc15" },
    Platyna: { image: platinumBadge, glow: "#22d3ee" },
    Kryształ: { image: crystalBadge, glow: "#a78bfa" },
    Diament: { image: diamondBadge, glow: "#38bdf8" },
    Pryzmat: { image: prismBadge, glow: "#f472b6" },
    "Legendarny I": { image: legendOneBadge, glow: "#fb7185" },
    "Legendarny II": { image: legendTwoBadge, glow: "#ef4444" },
    Mityczny: { image: mythicBadge, glow: "#e879f9" }
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

    return (
        <span
            role="img"
            aria-label={`Odznaka ligi ${name}`}
            className={`relative inline-grid shrink-0 place-items-center ${SIZES[size] || SIZES.md} ${className}`}
            style={{
                filter: muted
                    ? "grayscale(0.9) saturate(0.35) opacity(0.68)"
                    : `drop-shadow(0 10px 18px ${config.glow}55)`
            }}
        >
            {!muted && (
                <span
                    aria-hidden="true"
                    className="absolute inset-[15%] rounded-full opacity-30 blur-xl"
                    style={{ backgroundColor: config.glow }}
                />
            )}
            <img
                src={config.image}
                alt=""
                draggable="false"
                className="relative h-full w-full select-none object-contain transition-transform duration-300 group-hover:scale-105"
            />
        </span>
    );
}
