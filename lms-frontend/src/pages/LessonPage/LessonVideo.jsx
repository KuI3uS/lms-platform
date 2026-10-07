import { BsPlayBtn } from "react-icons/bs";

function youtubeEmbedUrl(value) {
    if (!value) return null;

    try {
        const url = new URL(value);
        const host = url.hostname.replace("www.", "");
        let videoId = null;

        if (host === "youtu.be") {
            videoId = url.pathname.split("/").filter(Boolean)[0];
        } else if (host === "youtube.com" || host === "m.youtube.com") {
            videoId = url.searchParams.get("v");
            if (!videoId) {
                const parts = url.pathname.split("/").filter(Boolean);
                if (["embed", "shorts", "live"].includes(parts[0])) {
                    videoId = parts[1];
                }
            }
        }

        return videoId
            ? `https://www.youtube-nocookie.com/embed/${videoId}`
            : null;
    } catch {
        return null;
    }
}

export default function LessonVideo({ block }) {
    const embedUrl = youtubeEmbedUrl(block.mediaUrl);

    return (
        <section className="overflow-hidden rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-gray-900 to-gray-950">
            <header className="flex items-center gap-4 border-b border-white/10 p-5 sm:p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-2xl text-rose-200">
                    <BsPlayBtn />
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-300">
                        Materiał wideo
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                        {block.title || "Film do lekcji"}
                    </h2>
                </div>
            </header>

            {block.description && (
                <p className="px-5 pt-5 leading-7 text-gray-300 sm:px-6">
                    {block.description}
                </p>
            )}

            <div className="p-5 sm:p-6">
                {!block.mediaUrl ? (
                    <div className="rounded-2xl border border-dashed border-rose-400/30 p-10 text-center text-gray-400">
                        Brak adresu filmu.
                    </div>
                ) : embedUrl ? (
                    <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                        <iframe
                            src={embedUrl}
                            title={block.title || "Film do lekcji"}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                        />
                    </div>
                ) : (
                    <video
                        src={block.mediaUrl}
                        controls
                        preload="metadata"
                        className="max-h-[70vh] w-full rounded-2xl border border-white/10 bg-black"
                    >
                        Twoja przeglądarka nie obsługuje tego filmu.
                    </video>
                )}
            </div>
        </section>
    );
}
