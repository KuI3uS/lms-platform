import {
    BsCodeSlash,
    BsClipboard,
    BsCheck
} from "react-icons/bs";
import { useState } from "react";

export default function LessonExample({ block }) {

    const [copied, setCopied] = useState(false);

    async function copy() {

        try {

            await navigator.clipboard.writeText(
                block.content || ""
            );

            setCopied(true);

            setTimeout(() => {

                setCopied(false);

            }, 2000);

        }

        catch (e) {

            console.error(e);

        }

    }

    return (

        <section className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 via-gray-900 to-gray-950 overflow-hidden">

            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">

                <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">

                        <BsCodeSlash size={22} />

                    </div>

                    <div>

                        <p className="text-sm text-green-300 font-semibold">

                            Przykład kodu

                        </p>

                        <h2 className="text-xl font-bold">

                            {block.title || "Przykład"}

                        </h2>

                        {block.language && (

                            <p className="text-xs text-gray-400 uppercase mt-1">

                                {block.language}

                            </p>

                        )}

                    </div>

                </div>

                <button
                    type="button"
                    onClick={copy}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition"
                >

                    {copied
                        ? <BsCheck />
                        : <BsClipboard />
                    }

                    {copied
                        ? "Skopiowano"
                        : "Kopiuj"
                    }

                </button>

            </div>

            {/* OPIS */}

            {block.description && (

                <div className="px-6 py-5 border-b border-gray-800 text-gray-300 whitespace-pre-line">

                    {block.description}

                </div>

            )}

            {/* KOD */}

            <pre className="overflow-x-auto bg-[#0d1117] p-8">

                <code className="text-green-400 text-[15px] leading-7 font-mono whitespace-pre">

                    {block.content}

                </code>

            </pre>

        </section>

    );

}