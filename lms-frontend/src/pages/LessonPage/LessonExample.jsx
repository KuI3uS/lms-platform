import { BsCodeSlash, BsClipboard } from "react-icons/bs";

export default function LessonExample({ block }) {

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(block.content || "");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <section className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 via-gray-900 to-gray-950 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">

                <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                        <BsCodeSlash size={22} />
                    </div>

                    <div>
                        <p className="text-sm text-green-300 font-semibold">
                            Przykład
                        </p>

                        <h2 className="text-xl font-bold">
                            {block.title || "Kod przykładowy"}
                        </h2>
                    </div>

                </div>

                <button
                    onClick={copy}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition"
                >
                    <BsClipboard />
                    Kopiuj
                </button>

            </div>

            <pre className="overflow-x-auto p-8 bg-[#0d1117] text-green-400 text-[15px] leading-7 font-mono">
                <code>
                    {block.content}
                </code>
            </pre>

        </section>
    );
}