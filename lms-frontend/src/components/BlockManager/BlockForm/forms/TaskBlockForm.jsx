import {
    BsCardText,
    BsCodeSlash,
    BsLightbulb,
    BsCheckCircle,
    BsGlobe,
    BsStar
} from "react-icons/bs";

export default function TaskBlockForm({
                                          block,
                                          setBlock
                                      }) {

    const update = (field, value) => {

        setBlock(prev => ({
            ...prev,
            [field]: value
        }));

    };

    return (

        <div className="space-y-6">

            {/* Treść */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsCardText />

                    Treść zadania

                </label>

                <textarea
                    value={block.content || ""}
                    placeholder="Opisz zadanie..."
                    onChange={(e)=>update("content", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-40"
                />

            </div>

            {/* Kod */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsCodeSlash />

                    Kod startowy

                </label>

                <textarea
                    value={block.starterCode || ""}
                    placeholder="public class Main..."
                    onChange={(e)=>update("starterCode", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-72 font-mono"
                />

            </div>

            {/* Język */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsGlobe />

                    Język

                </label>

                <input
                    value={block.language || "java"}
                    onChange={(e)=>update("language", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            {/* Odpowiedź */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsCheckCircle />

                    Oczekiwana odpowiedź

                </label>

                <textarea
                    value={block.expectedAnswer || ""}
                    placeholder="Poprawne rozwiązanie..."
                    onChange={(e)=>update("expectedAnswer", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-52 font-mono"
                />

            </div>

            {/* Hint */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsLightbulb />

                    Podpowiedź

                </label>

                <textarea
                    value={block.hint || ""}
                    placeholder="Podpowiedź dla ucznia..."
                    onChange={(e)=>update("hint", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                />

            </div>

            {/* XP */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-gray-300">

                    <BsStar />

                    XP za ukończenie

                </label>

                <input
                    type="number"
                    min={0}
                    value={block.points ?? 25}
                    onChange={(e)=>update("points", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

        </div>

    );

}