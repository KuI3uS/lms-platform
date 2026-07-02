import Editor from "@monaco-editor/react";
import { BsCodeSlash } from "react-icons/bs";

export default function MonacoEditorBox({
                                            value,
                                            language = "java",
                                            onChange
                                        }) {
    return (
        <div className="rounded-3xl overflow-hidden border border-gray-700 bg-gray-950 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                        <BsCodeSlash />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">
                            Edytor kodu
                        </p>

                        <p className="font-bold text-gray-200">
                            {language.toUpperCase()}
                        </p>
                    </div>
                </div>

                <span className="text-xs text-gray-500">
                    Ctrl + S nie jest wymagane
                </span>
            </div>

            <Editor
                height="560px"
                language={language}
                theme="vs-dark"
                value={value}
                onChange={(newValue) => onChange(newValue || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    padding: {
                        top: 18,
                        bottom: 18
                    }
                }}
            />
        </div>
    );
}