"use client";

import dynamic from "next/dynamic";
import type { Language, HeroTheme } from "@/lib/types";
import type { editor } from "monaco-editor";
import { useRef, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { useFileStore, type FileNode } from "@/store/file-store";

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
  bash: "shell",
  html: "html",
  css: "css",
  json: "json",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  swift: "swift",
};

/* ────────────────────────────────────────────
   Hero-themed Monaco editor color schemes
   Each hero has a unique vibe reflected in
   the syntax highlighting and UI chrome.
   ──────────────────────────────────────────── */
interface HeroMonacoTheme {
  base: "vs-dark";
  inherit: boolean;
  rules: Array<{ token: string; foreground?: string; fontStyle?: string }>;
  colors: Record<string, string>;
}

const HERO_THEMES: Record<HeroTheme, HeroMonacoTheme> = {
  spiderman: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7280", fontStyle: "italic" },
      { token: "keyword", foreground: "ef4444" },
      { token: "keyword.control", foreground: "ef4444" },
      { token: "string", foreground: "f97316" },
      { token: "number", foreground: "fbbf24" },
      { token: "type", foreground: "60a5fa" },
      { token: "type.identifier", foreground: "60a5fa" },
      { token: "function", foreground: "38bdf8" },
      { token: "variable", foreground: "e2e8f0" },
      { token: "constant", foreground: "f97316" },
      { token: "operator", foreground: "ef4444" },
      { token: "delimiter", foreground: "94a3b8" },
      { token: "tag", foreground: "ef4444" },
      { token: "attribute.name", foreground: "60a5fa" },
      { token: "attribute.value", foreground: "f97316" },
    ],
    colors: {
      "editor.background": "#0c0810",
      "editor.foreground": "#e2e8f0",
      "editor.lineHighlightBackground": "#ef444408",
      "editor.selectionBackground": "#ef444425",
      "editorCursor.foreground": "#ef4444",
      "editor.selectionHighlightBackground": "#2563eb15",
      "editorLineNumber.foreground": "#4a3040",
      "editorLineNumber.activeForeground": "#ef4444",
      "editorIndentGuide.background": "#1e1020",
      "editorIndentGuide.activeBackground": "#ef444430",
      "editor.findMatchBackground": "#ef444440",
      "editor.findMatchHighlightBackground": "#2563eb30",
      "editorBracketMatch.background": "#ef444418",
      "editorBracketMatch.border": "#ef444440",
      "editorWidget.background": "#0c0810",
      "editorWidget.border": "#ef444420",
      "editorSuggestWidget.background": "#0c0810",
      "editorSuggestWidget.border": "#ef444015",
      "editorSuggestWidget.selectedBackground": "#ef444418",
      "scrollbarSlider.background": "#ef444415",
      "scrollbarSlider.hoverBackground": "#ef444425",
    },
  },
  batman: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "475569", fontStyle: "italic" },
      { token: "keyword", foreground: "eab308" },
      { token: "keyword.control", foreground: "d4a30a" },
      { token: "string", foreground: "a3e635" },
      { token: "number", foreground: "fbbf24" },
      { token: "type", foreground: "94a3b8" },
      { token: "type.identifier", foreground: "94a3b8" },
      { token: "function", foreground: "e2e8f0" },
      { token: "variable", foreground: "cbd5e1" },
      { token: "constant", foreground: "fbbf24" },
      { token: "operator", foreground: "eab308" },
      { token: "delimiter", foreground: "64748b" },
      { token: "tag", foreground: "eab308" },
      { token: "attribute.name", foreground: "94a3b8" },
      { token: "attribute.value", foreground: "a3e635" },
    ],
    colors: {
      "editor.background": "#06080c",
      "editor.foreground": "#cbd5e1",
      "editor.lineHighlightBackground": "#eab30806",
      "editor.selectionBackground": "#eab30820",
      "editorCursor.foreground": "#eab308",
      "editor.selectionHighlightBackground": "#33415510",
      "editorLineNumber.foreground": "#1e293b",
      "editorLineNumber.activeForeground": "#eab308",
      "editorIndentGuide.background": "#0f172a",
      "editorIndentGuide.activeBackground": "#eab30825",
      "editor.findMatchBackground": "#eab30835",
      "editor.findMatchHighlightBackground": "#33415520",
      "editorBracketMatch.background": "#eab30812",
      "editorBracketMatch.border": "#eab30835",
      "editorWidget.background": "#06080c",
      "editorWidget.border": "#eab30815",
      "editorSuggestWidget.background": "#06080c",
      "editorSuggestWidget.border": "#eab30810",
      "editorSuggestWidget.selectedBackground": "#eab30815",
      "scrollbarSlider.background": "#eab30810",
      "scrollbarSlider.hoverBackground": "#eab30820",
    },
  },
  superman: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7280", fontStyle: "italic" },
      { token: "keyword", foreground: "3b82f6" },
      { token: "keyword.control", foreground: "2563eb" },
      { token: "string", foreground: "f87171" },
      { token: "number", foreground: "fbbf24" },
      { token: "type", foreground: "93c5fd" },
      { token: "type.identifier", foreground: "93c5fd" },
      { token: "function", foreground: "f8fafc" },
      { token: "variable", foreground: "e2e8f0" },
      { token: "constant", foreground: "ef4444" },
      { token: "operator", foreground: "60a5fa" },
      { token: "delimiter", foreground: "94a3b8" },
      { token: "tag", foreground: "3b82f6" },
      { token: "attribute.name", foreground: "93c5fd" },
      { token: "attribute.value", foreground: "f87171" },
    ],
    colors: {
      "editor.background": "#070810",
      "editor.foreground": "#e2e8f0",
      "editor.lineHighlightBackground": "#2563eb08",
      "editor.selectionBackground": "#2563eb25",
      "editorCursor.foreground": "#3b82f6",
      "editor.selectionHighlightBackground": "#ef444415",
      "editorLineNumber.foreground": "#1e2a50",
      "editorLineNumber.activeForeground": "#3b82f6",
      "editorIndentGuide.background": "#0c1030",
      "editorIndentGuide.activeBackground": "#2563eb30",
      "editor.findMatchBackground": "#2563eb40",
      "editor.findMatchHighlightBackground": "#ef444420",
      "editorBracketMatch.background": "#2563eb18",
      "editorBracketMatch.border": "#2563eb40",
      "editorWidget.background": "#070810",
      "editorWidget.border": "#2563eb20",
      "editorSuggestWidget.background": "#070810",
      "editorSuggestWidget.border": "#2563eb15",
      "editorSuggestWidget.selectedBackground": "#2563eb18",
      "scrollbarSlider.background": "#2563eb15",
      "scrollbarSlider.hoverBackground": "#2563eb25",
    },
  },
  ironman: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7280", fontStyle: "italic" },
      { token: "keyword", foreground: "f59e0b" },
      { token: "keyword.control", foreground: "f59e0b" },
      { token: "string", foreground: "34d399" },
      { token: "number", foreground: "fbbf24" },
      { token: "type", foreground: "60a5fa" },
      { token: "type.identifier", foreground: "60a5fa" },
      { token: "function", foreground: "f8fafc" },
      { token: "variable", foreground: "e2e8f0" },
      { token: "constant", foreground: "f97316" },
      { token: "operator", foreground: "f59e0b" },
      { token: "delimiter", foreground: "94a3b8" },
      { token: "tag", foreground: "f59e0b" },
      { token: "attribute.name", foreground: "60a5fa" },
      { token: "attribute.value", foreground: "34d399" },
    ],
    colors: {
      "editor.background": "#0a0808",
      "editor.foreground": "#e2e8f0",
      "editor.lineHighlightBackground": "#f59e0b08",
      "editor.selectionBackground": "#f59e0b22",
      "editorCursor.foreground": "#f59e0b",
      "editor.selectionHighlightBackground": "#ef444412",
      "editorLineNumber.foreground": "#3a2510",
      "editorLineNumber.activeForeground": "#f59e0b",
      "editorIndentGuide.background": "#1a1008",
      "editorIndentGuide.activeBackground": "#f59e0b28",
      "editor.findMatchBackground": "#f59e0b38",
      "editor.findMatchHighlightBackground": "#ef444420",
      "editorBracketMatch.background": "#f59e0b15",
      "editorBracketMatch.border": "#f59e0b38",
      "editorWidget.background": "#0a0808",
      "editorWidget.border": "#f59e0b18",
      "editorSuggestWidget.background": "#0a0808",
      "editorSuggestWidget.border": "#f59e0b12",
      "editorSuggestWidget.selectedBackground": "#f59e0b15",
      "scrollbarSlider.background": "#f59e0b12",
      "scrollbarSlider.hoverBackground": "#f59e0b22",
    },
  },
};

function getHeroThemeName(theme: HeroTheme): string {
  return `hero-${theme}`;
}

const PROJECT_TYPES_URI = "ts:filename/superhero-workspace-dependencies.d.ts";

function walkFiles(nodes: FileNode[], visitor: (node: FileNode) => void) {
  for (const node of nodes) {
    visitor(node);
    if (node.children) walkFiles(node.children, visitor);
  }
}

function collectPackageDependencies(files: FileNode[]): string[] {
  const dependencies = new Set<string>();

  walkFiles(files, (node) => {
    if (node.type !== "file" || node.name !== "package.json" || !node.content) return;
    try {
      const parsed = JSON.parse(node.content) as Record<string, unknown>;
      for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        const values = parsed[section];
        if (!values || typeof values !== "object" || Array.isArray(values)) continue;
        for (const name of Object.keys(values)) {
          dependencies.add(name);
        }
      }
    } catch {
      // Keep editor diagnostics alive while package.json is temporarily invalid.
    }
  });

  return [...dependencies].sort((a, b) => a.localeCompare(b));
}

function buildWorkspaceTypeDeclarations(files: FileNode[]): string {
  const dependencies = collectPackageDependencies(files);
  const moduleDeclarations = dependencies
    .map((dependency) => {
      const escaped = dependency.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `declare module "${escaped}";\ndeclare module "${escaped}/*";`;
    })
    .join("\n");

  return `
declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.less";
declare module "*.svg" { const src: string; export default src; }
declare module "*.png" { const src: string; export default src; }
declare module "*.jpg" { const src: string; export default src; }
declare module "*.jpeg" { const src: string; export default src; }
declare module "*.gif" { const src: string; export default src; }
declare module "*.webp" { const src: string; export default src; }
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any; } }
${moduleDeclarations}
`;
}

function collectWorkspaceEditorFiles(files: FileNode[]) {
  const editorFiles: Array<{ path: string; language: string; content: string }> = [];

  const visit = (nodes: FileNode[], parentPath = "") => {
    for (const node of nodes) {
      const path = parentPath ? `${parentPath}/${node.name}` : node.name;
      if (node.type === "file" && node.content !== undefined && node.language) {
        const language = languageMap[node.language];
        if (language && ["typescript", "javascript", "json", "css", "html"].includes(language)) {
          editorFiles.push({ path, language, content: node.content });
        }
      }
      if (node.children) visit(node.children, path);
    }
  };

  visit(files);
  return editorFiles;
}

function toWorkspaceUri(path: string): string {
  return `file:///${path.replace(/^\/+/, "")}`;
}

export function CodeEditor({
  language,
  path,
  value,
  onChange
}: {
  language: Language;
  path: string | null;
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const projectTypesRef = useRef<Array<{ dispose: () => void }>>([]);
  const theme = useAppStore((s) => s.theme);
  const files = useFileStore((s) => s.files);
  const projectTypes = useMemo(() => buildWorkspaceTypeDeclarations(files), [files]);
  const workspaceEditorFiles = useMemo(() => collectWorkspaceEditorFiles(files), [files]);
  const editorPath = path ? toWorkspaceUri(path) : `file:///untitled.${languageMap[language]}`;

  const syncProjectTypes = useCallback((monaco: typeof import("monaco-editor")) => {
    for (const disposable of projectTypesRef.current) {
      disposable.dispose();
    }
    projectTypesRef.current = [
      monaco.languages.typescript.typescriptDefaults.addExtraLib(projectTypes, PROJECT_TYPES_URI),
      monaco.languages.typescript.javascriptDefaults.addExtraLib(projectTypes, PROJECT_TYPES_URI),
    ];

    for (const workspaceFile of workspaceEditorFiles) {
      const uri = monaco.Uri.parse(toWorkspaceUri(workspaceFile.path));
      const model = monaco.editor.getModel(uri);
      if (workspaceFile.path === path) continue;
      if (model) {
        if (model.getValue() !== workspaceFile.content) {
          model.setValue(workspaceFile.content);
        }
        continue;
      }
      monaco.editor.createModel(workspaceFile.content, workspaceFile.language, uri);
    }
  }, [path, projectTypes, workspaceEditorFiles]);

  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = ed;
    monacoRef.current = monaco;

    // Register all hero themes
    for (const [heroKey, heroTheme] of Object.entries(HERO_THEMES)) {
      monaco.editor.defineTheme(getHeroThemeName(heroKey as HeroTheme), heroTheme);
    }

    // Set the current theme
    monaco.editor.setTheme(getHeroThemeName(theme));
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      resolveJsonModule: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      noEmit: true,
      skipLibCheck: true,
      strict: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
    });
    // Reduce noisy diagnostics — imports won't resolve without real node_modules
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        2307, // Cannot find module 'X'
        2304, // Cannot find name 'X'
        2503, // Cannot find namespace 'X'
        7016, // Could not find declaration file for module 'X'
        2686, // 'X' refers to a UMD global
        2792, // Cannot find module 'X'. Did you mean to set...
        1259, // Module 'X' can only be default-imported using...
        1192, // Module 'X' has no default export
        2305, // Module 'X' has no exported member 'Y'
      ],
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    syncProjectTypes(monaco);

    // Register Ctrl+Shift+F / Cmd+Shift+F to format document
    ed.addAction({
      id: "format-document",
      label: "Format Document",
      keybindings: [
        // Monaco.KeyMod.CtrlCmd | Monaco.KeyMod.Shift | Monaco.KeyCode.KeyF
        2048 | 1024 | 36,
      ],
      run: (editor) => {
        editor.getAction("editor.action.formatDocument")?.run();
      },
    });
  }, [syncProjectTypes, theme]);

  // Switch theme when hero changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(getHeroThemeName(theme));
    }
  }, [theme]);

  useEffect(() => {
    if (monacoRef.current) {
      syncProjectTypes(monacoRef.current);
    }
  }, [syncProjectTypes]);

  return (
    <MonacoEditor
      height="100%"
      path={editorPath}
      language={languageMap[language]}
      value={value}
      onChange={(updated) => onChange(updated ?? "")}
      theme="vs-dark"
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        fontLigatures: true,
        wordWrap: "on",
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        // Code formatting improvements
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: "advanced",
        tabSize: 2,
        detectIndentation: true,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        suggestOnTriggerCharacters: true,
        parameterHints: { enabled: true },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        // Visual polish
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        roundedSelection: true,
        guides: {
          bracketPairs: true,
          indentation: true,
        },
      }}
    />
  );
}
