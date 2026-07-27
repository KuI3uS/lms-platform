import { BsDownload, BsFileEarmarkArrowDown } from "react-icons/bs";

export default function LessonDownload({ block }) {
    return (
        <section className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-gray-900 to-gray-950 p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cyan-500/15 text-3xl text-cyan-200">
                    <BsFileEarmarkArrowDown />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                        Materiał do pobrania
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                        {block.title || "Plik do lekcji"}
                    </h2>
                    {block.description && (
                        <p className="mt-2 leading-7 text-gray-400">
                            {block.description}
                        </p>
                    )}
                </div>

                {block.mediaUrl ? (
                    <a
                        href={block.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                        <BsDownload />
                        Otwórz plik
                    </a>
                ) : (
                    <span className="rounded-xl border border-dashed border-cyan-400/30 px-4 py-3 text-sm text-gray-500">
                        Brak adresu pliku
                    </span>
                )}
            </div>
        </section>
    );
}
