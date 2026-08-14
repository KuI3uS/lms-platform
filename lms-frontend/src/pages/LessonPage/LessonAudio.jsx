import { BsHeadphones } from "react-icons/bs";
import PronunciationTrainer from "../../components/PronunciationTrainer";

export default function LessonAudio({ block }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-gray-900 to-gray-950">
            <div className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-violet-300"><BsHeadphones /> Słuchanie i wymowa</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{block.title}</h2>
                {block.description && <p className="mt-3 leading-7 text-slate-400">{block.description}</p>}
                <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-xl font-black leading-9 text-white sm:text-2xl">{block.content}</p>
            </div>
            <div className="p-4 sm:p-8">
                <PronunciationTrainer blockId={block.id} phrase={block.content} language={block.language} audioUrl={block.mediaUrl} />
            </div>
        </section>
    );
}
