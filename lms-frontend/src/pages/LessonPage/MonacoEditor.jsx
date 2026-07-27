import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";
import {
    BsCodeSlash,
    BsTerminal,
    BsLightningChargeFill
} from "react-icons/bs";

const CODE_FONT = "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

function needsNativeEditor() {
    if (typeof navigator === "undefined") return false;

    const userAgent = navigator.userAgent || "";
    const isAppleWebKit = /AppleWebKit/i.test(userAgent);
    const isDesktopChromium = /Chrome|Chromium|Edg|OPR/i.test(userAgent);

    return isAppleWebKit && !isDesktopChromium;
}

function EditorHeader({ language, native }) {
    return (
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-4">
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg sm:flex">
                    <BsCodeSlash size={22} className="text-white"/>
                </div>

                <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-blue-300">
                        Code Editor
                    </div>
                    <div className="text-xl font-black">
                        {language.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <BsTerminal className="text-green-400"/>
                    <span className="text-sm text-gray-300">
                        {native ? "Tryb zgodności" : "Monaco"}
                    </span>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/15 px-4 py-2">
                    <BsLightningChargeFill className="text-yellow-300"/>
                    <span className="text-sm font-semibold">Live</span>
                </div>
            </div>
        </div>
    );
}

function NativeCodeEditor({ value, language, onChange }) {
    const gutterRef = useRef(null);
    const lineCount = Math.max(12, value.split("\n").length);

    function synchronizeScroll(event) {
        if (gutterRef.current) {
            gutterRef.current.scrollTop = event.currentTarget.scrollTop;
        }
    }

    return (
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1220] shadow-[0_20px_80px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"/>
            <EditorHeader language={language} native/>

            <div className="relative flex h-[min(600px,65vh)] min-h-80 bg-[#0b1220]">
                <div
                    ref={gutterRef}
                    aria-hidden="true"
                    className="pointer-events-none h-full w-14 shrink-0 overflow-hidden border-r border-white/5 bg-slate-950/35 py-6 text-right font-mono text-[17px] leading-7 text-slate-600"
                >
                    {Array.from({ length: lineCount }, (_, index) => (
                        <div key={index} className="pr-4">{index + 1}</div>
                    ))}
                </div>

                <textarea
                    aria-label="Edytor kodu"
                    className="native-code-editor h-full min-w-0 flex-1 resize-none overflow-auto whitespace-pre bg-transparent px-5 py-6 text-[17px] leading-7 outline-none"
                    style={{ fontFamily: CODE_FONT, tabSize: 4 }}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onScroll={synchronizeScroll}
                    wrap="off"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                />
            </div>
        </section>
    );
}

export default function MonacoEditorBox({

                                            value,
                                            language = "java",
                                            onChange

                                        }) {
    const useNativeEditor = useMemo(() => needsNativeEditor(), []);
    const editorRef = useRef(null);
    const lastEmittedValueRef = useRef(value);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor || value === lastEmittedValueRef.current) return;
        if (editor.getValue() === value) return;

        editor.setValue(value);
        const model = editor.getModel();

        if (model) {
            const lastLine = model.getLineCount();
            editor.setPosition({
                lineNumber: lastLine,
                column: model.getLineMaxColumn(lastLine)
            });
        }
    }, [value]);

    function configureTheme(monaco) {
        monaco.editor.defineTheme("eduhub-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": "#0b1220",
                "editorCursor.foreground": "#38bdf8",
                "editor.selectionBackground": "#2563eb99",
                "editor.inactiveSelectionBackground": "#2563eb66",
                "editor.selectionHighlightBackground": "#0ea5e933",
                "editor.lineHighlightBackground": "#17203380",
                "editor.lineHighlightBorder": "#33415580"
            }
        });
    }

    function mountEditor(editor, monaco) {
        editorRef.current = editor;

        const remeasureAndLayout = () => {
            monaco.editor.remeasureFonts();
            editor.layout();
        };

        requestAnimationFrame(remeasureAndLayout);
        document.fonts?.ready?.then(remeasureAndLayout);
    }

    function handleChange(nextValue) {
        const normalizedValue = nextValue || "";
        lastEmittedValueRef.current = normalizedValue;
        onChange(normalizedValue);
    }

    if (useNativeEditor) {
        return (
            <NativeCodeEditor
                value={value}
                language={language}
                onChange={onChange}
            />
        );
    }

    return (

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1220] shadow-[0_20px_80px_rgba(0,0,0,.45)]">

            {/* Glow */}

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />

            {/* Header */}

            <EditorHeader language={language}/>

            {/* Editor */}

            <Editor

                height="min(600px, 65vh)"

                language={language}

                theme="eduhub-dark"

                defaultValue={value}

                beforeMount={configureTheme}

                onMount={mountEditor}

                onChange={handleChange}

                options={{

                    minimap: {
                        enabled: false
                    },

                    fontSize: 17,

                    lineHeight: 28,

                    fontFamily: CODE_FONT,

                    fontLigatures: false,

                    disableMonospaceOptimizations: true,

                    automaticLayout: true,

                    smoothScrolling: true,

                    /*
                     * EditContext jest nadal eksperymentalny i w części
                     * przeglądarek rozjeżdża pozycję warstwy kursora po
                     * kontrolowanej aktualizacji Reacta. Stabilny mechanizm
                     * textarea Monaco zachowuje pozycję zaznaczenia.
                     */
                    editContext: false,

                    cursorBlinking: "blink",

                    cursorSmoothCaretAnimation: "off",

                    cursorStyle: "line",

                    cursorWidth: 3,

                    scrollBeyondLastLine: false,

                    wordWrap: "on",

                    tabSize: 4,

                    renderLineHighlight: "all",

                    renderLineHighlightOnlyWhenFocus: false,

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
