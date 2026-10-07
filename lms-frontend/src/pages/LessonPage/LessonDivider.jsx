export default function LessonDivider({ block }) {
    const style = block.mediaType || "gradient";

    return (
        <section className="py-4 sm:py-8">
            {block.title && (
                <p className="mb-4 text-center text-sm font-black uppercase tracking-[0.28em] text-gray-300">
                    {block.title}
                </p>
            )}
            {style === "dots" ? (
                <div className="flex justify-center gap-3 text-xl text-blue-300">
                    <span>•</span><span>•</span><span>•</span>
                </div>
            ) : style === "line" ? (
                <div className="h-px bg-gray-700" />
            ) : (
                <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
            )}
        </section>
    );
}
