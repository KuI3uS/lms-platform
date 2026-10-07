import Editor from "@monaco-editor/react";
import {
    BsCodeSlash,
    BsTerminal,
    BsLightningChargeFill
} from "react-icons/bs";

export default function MonacoEditorBox({

                                            value,
                                            language = "java",
                                            onChange

                                        }) {

    return (

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1220] shadow-[0_20px_80px_rgba(0,0,0,.45)]">

            {/* Glow */}

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />

            {/* Header */}

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-xl">

                <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">

                        <BsCodeSlash
                            size={22}
                            className="text-white"
                        />

                    </div>

                    <div>

                        <div className="text-xs uppercase tracking-[0.2em] text-blue-300">

                            Code Editor

                        </div>

                        <div className="font-black text-xl">

                            {language.toUpperCase()}

                        </div>

                    </div>

                </div>

                <div className="flex items-center gap-3">

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">

                        <BsTerminal
                            className="text-green-400"
                        />

                        <span className="text-sm text-gray-300">

                            Monaco

                        </span>

                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/20">

                        <BsLightningChargeFill
                            className="text-yellow-300"
                        />

                        <span className="text-sm font-semibold">

                            Live

                        </span>

                    </div>

                </div>

            </div>

            {/* Editor */}

            <Editor

                height="600px"

                language={language}

                theme="vs-dark"

                value={value}

                onChange={(v)=>onChange(v || "")}

                options={{

                    minimap: {
                        enabled: false
                    },

                    fontSize: 17,

                    lineHeight: 28,

                    fontLigatures: true,

                    automaticLayout: true,

                    smoothScrolling: true,

                    cursorBlinking: "smooth",

                    cursorSmoothCaretAnimation: "on",

                    scrollBeyondLastLine: false,

                    wordWrap: "on",

                    tabSize: 4,

                    renderLineHighlight: "all",

                    roundedSelection: true,

                    glyphMargin: false,

                    folding: true,

                    bracketPairColorization: {
                        enabled: true
                    },

                    guides: {
                        bracketPairs: true,
                        indentation: true
                    },

                    padding: {
                        top: 24,
                        bottom: 24
                    }

                }}

            />

        </section>

    );

}