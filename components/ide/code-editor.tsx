"use client";

import dynamic from "next/dynamic";
import type { Language } from "@/lib/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading Monaco editor...
    </div>
  )
});

const languageMap: Record<Language, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  bash: "shell"
};

export function CodeEditor({
  language,
  value,
  onChange
}: {
  language: Language;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <MonacoEditor
      height="100%"
      language={languageMap[language]}
      value={value}
      onChange={(updated) => onChange(updated ?? "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontLigatures: true,
        wordWrap: "on",
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false
      }}
    />
  );
}
