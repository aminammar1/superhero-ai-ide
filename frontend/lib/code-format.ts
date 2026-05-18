import type { Language } from "@/lib/types";

const EXTENSION_LANGUAGE: Record<string, Language> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "c",
  hpp: "cpp",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  less: "css",
  json: "json",
  jsonc: "json",
  rs: "rust",
  rb: "ruby",
  php: "php",
  swift: "swift",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
};

const TWO_SPACE_LANGUAGES = new Set<Language>([
  "typescript",
  "javascript",
  "html",
  "css",
  "json",
]);

export function detectLanguageFromName(name: string): Language | undefined {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? EXTENSION_LANGUAGE[ext] : undefined;
}

export function normalizeWorkspacePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

export function normalizeGeneratedCode(path: string, rawContent: string): string {
  const language = detectLanguageFromName(path);
  let content = rawContent
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

  content = stripSingleCodeFence(content);

  if (language === "json") {
    const formatted = tryFormatJson(content);
    if (formatted !== null) return formatted;
  }

  const indentSize = language && TWO_SPACE_LANGUAGES.has(language) ? 2 : 4;
  return normalizeLines(content, indentSize);
}

function stripSingleCodeFence(content: string): string {
  const trimmed = content.trim();
  const match = /^```[\w-]*\n([\s\S]*?)\n```$/.exec(trimmed);
  return match?.[1] ?? content;
}

function tryFormatJson(content: string): string | null {
  try {
    return `${JSON.stringify(JSON.parse(content), null, 2)}\n`;
  } catch {
    return null;
  }
}

function normalizeLines(content: string, indentSize: number): string {
  const lines = content.split("\n").map((line) => line.replace(/[ \t]+$/g, ""));
  const minIndent = lines
    .filter((line) => line.trim())
    .reduce((min, line) => {
      const indent = line.match(/^[ \t]*/)?.[0] ?? "";
      const width = indent.replace(/\t/g, " ".repeat(indentSize)).length;
      return Math.min(min, width);
    }, Number.POSITIVE_INFINITY);

  const normalized = lines.map((line) => {
    const detabbed = line.replace(/\t/g, " ".repeat(indentSize));
    if (!Number.isFinite(minIndent) || minIndent <= 0) return detabbed;
    return detabbed.startsWith(" ".repeat(minIndent))
      ? detabbed.slice(minIndent)
      : detabbed.trimStart();
  });

  return `${normalized.join("\n").trim()}\n`;
}
