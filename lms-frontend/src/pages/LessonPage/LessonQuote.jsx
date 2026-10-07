import { BsQuote } from "react-icons/bs";

export default function LessonQuote({ block }) {
    return (
        <figure className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-gray-900 to-gray-950 p-7 sm:p-10">
            <BsQuote className="absolute -right-3 -top-6 text-[9rem] text-orange-400/[0.07]" />
            {block.title && (
                <p className="relative text-sm font-black uppercase tracking-[0.2em] text-orange-300">
                    {block.title}
                </p>
            )}
            <blockquote className="relative mt-4 max-w-4xl text-2xl font-semibold italic leading-10 text-orange-50 sm:text-3xl sm:leading-[1.45]">
                „{block.content || "Brak treści cytatu."}”
            </blockquote>
            {block.description && (
                <figcaption className="relative mt-6 border-t border-orange-300/15 pt-4 font-bold text-orange-200">
                    — {block.description}
                </figcaption>
            )}
        </figure>
    );
}
