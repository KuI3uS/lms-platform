import { useMemo, useRef, useState } from "react";
import { BsArrowCounterclockwise, BsCheckCircleFill, BsGrid3X3Gap } from "react-icons/bs";
import { parseSentenceBuilderContent, sentenceWordMatches } from "../../utils/sentenceBuilder";

function shuffledTiles(words) {
    const tiles = words.map((word, index) => ({ id: `${index}-${word}`, word }));
    for (let index = tiles.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
    }
    if (tiles.length > 1 && tiles.every((tile, index) => tile.word === words[index])) {
        [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
    }
    return tiles;
}

export default function LessonSentenceBuilder({ block, onComplete }) {
    const config = useMemo(() => parseSentenceBuilderContent(block.content), [block.content]);
    const [available, setAvailable] = useState(() => shuffledTiles(config.words));
    const [chosen, setChosen] = useState([]);
    const [checked, setChecked] = useState(false);
    const [correct, setCorrect] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const draggedRef = useRef(null);

    const choose = (tile) => {
        if (checked) return;
        setAvailable((current) => current.filter((item) => item.id !== tile.id));
        setChosen((current) => [...current, tile]);
    };

    const returnTile = (tile) => {
        if (checked) return;
        setChosen((current) => current.filter((item) => item.id !== tile.id));
        setAvailable((current) => [...current, tile]);
    };

    const moveChosen = (from, to) => {
        if (checked || from === to || from == null || to == null) return;
        setChosen((current) => {
            const next = [...current];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const dropIntoSentence = (toIndex = chosen.length) => {
        const dragged = draggedRef.current;
        if (!dragged || checked) return;
        if (dragged.source === "available") {
            choose(dragged.tile);
        } else {
            moveChosen(dragged.index, Math.min(toIndex, Math.max(chosen.length - 1, 0)));
        }
        draggedRef.current = null;
    };

    const check = () => {
        if (chosen.length !== config.words.length) return;
        const isCorrect = chosen.every((tile, index) => sentenceWordMatches(tile.word, config.words[index]));
        setAttempts((value) => value + 1);
        setChecked(true);
        setCorrect(isCorrect);
        if (isCorrect && !block.correct) {
            onComplete?.(block.id, { completedItems: 1, score: 100 });
        }
    };

    const retry = () => {
        setAvailable(shuffledTiles(config.words));
        setChosen([]);
        setChecked(false);
        setCorrect(false);
    };

    const firstWrongIndex = checked && !correct
        ? chosen.findIndex((tile, index) => !sentenceWordMatches(tile.word, config.words[index]))
        : -1;

    return (
        <section className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-950">
            <div className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-300"><BsGrid3X3Gap /> Układanie zdania</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{block.title}</h2>
                <p className="mt-5 text-sm font-black uppercase tracking-wider text-slate-500">Ułóż zdanie po angielsku</p>
                <p className="mt-2 text-xl font-black leading-8 text-white sm:text-2xl">{config.polishSentence}</p>
            </div>

            <div className="space-y-6 p-5 sm:p-8">
                <div
                    className="min-h-24 rounded-2xl border-2 border-dashed border-white/15 bg-black/20 p-4"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropIntoSentence()}
                >
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Twoje zdanie</p>
                    <div className="flex min-h-11 flex-wrap gap-2">
                        {chosen.map((tile, index) => {
                            const matches = checked && sentenceWordMatches(tile.word, config.words[index]);
                            return (
                                <button
                                    key={tile.id}
                                    type="button"
                                    draggable={!checked}
                                    onDragStart={() => { draggedRef.current = { source: "chosen", index }; }}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => { event.stopPropagation(); dropIntoSentence(index); }}
                                    onClick={() => returnTile(tile)}
                                    className={`rounded-xl border px-4 py-2.5 font-black shadow-lg transition ${checked ? matches ? "border-emerald-300 bg-emerald-500/20 text-emerald-100" : "border-red-300 bg-red-500/20 text-red-100" : "cursor-grab border-blue-300/30 bg-blue-500/20 text-white hover:-translate-y-0.5"}`}
                                >
                                    {tile.word}
                                </button>
                            );
                        })}
                        {chosen.length === 0 && <span className="py-2 text-sm text-slate-600">Kliknij kafelki w odpowiedniej kolejności.</span>}
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Dostępne kafelki</p>
                    <div
                        className="flex min-h-12 flex-wrap gap-2"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                            const dragged = draggedRef.current;
                            if (dragged?.source === "chosen") {
                                returnTile(chosen[dragged.index]);
                                draggedRef.current = null;
                            }
                        }}
                    >
                        {available.map((tile) => (
                            <button key={tile.id} type="button" draggable onDragStart={() => { draggedRef.current = { source: "available", tile }; }} onClick={() => choose(tile)} className="cursor-grab rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 font-black text-white shadow hover:border-amber-300/40 hover:bg-amber-300/10">
                                {tile.word}
                            </button>
                        ))}
                    </div>
                </div>

                {checked && (
                    <div className={`rounded-2xl border p-4 ${correct ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-400/30 bg-red-500/10 text-red-100"}`}>
                        <p className="flex items-center gap-2 font-black">{correct && <BsCheckCircleFill />}{correct ? "Świetnie! Zdanie jest ułożone poprawnie." : "Nie wszystko jest na swoim miejscu."}</p>
                        {!correct && <p className="mt-2 text-sm leading-6">Zielone kafelki są poprawne. Pierwszy błąd jest na pozycji {firstWrongIndex + 1}. Powinno tam być: <strong>{config.words[firstWrongIndex]}</strong>. Ułóż całe zdanie ponownie.</p>}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    {!checked && <button type="button" disabled={chosen.length !== config.words.length} onClick={check} className="rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Sprawdź zdanie</button>}
                    {checked && !correct && <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"><BsArrowCounterclockwise /> Spróbuj ponownie</button>}
                    {checked && correct && attempts > 1 && <span className="self-center text-sm text-slate-400">Poprawnie po {attempts} próbach.</span>}
                </div>
            </div>
        </section>
    );
}
