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
  fish: "bash",
  lua: "bash",
  md: "bash",
  mdx: "bash",
  txt: "bash",
  log: "bash",
  csv: "bash",
  env: "bash",
  xml: "html",
  yaml: "bash",
  yml: "bash",
  toml: "bash",
  sql: "bash",
  graphql: "bash",
  gql: "bash",
  vue: "html",
  svelte: "html",
  astro: "html",
  prisma: "bash",
  scala: "java",
  kt: "java",
  kts: "java",
  dart: "javascript",
  cs: "cpp",
  fs: "bash",
  fsx: "bash",
  hs: "bash",
  clj: "bash",
  ex: "bash",
  exs: "bash",
  erl: "bash",
  hrl: "bash",
  r: "bash",
  rmd: "bash",
  proto: "bash",
  thrift: "bash",
  dockerfile: "bash",
  makefile: "bash",
  cmake: "bash",
  mod: "go",
  sum: "bash",
  lock: "bash",
  cfg: "bash",
  ini: "bash",
  conf: "bash",
  diff: "bash",
  patch: "bash",
};

/** Exact filename → language for files that don't use extensions */
const FILENAME_LANGUAGE: Record<string, Language> = {
  dockerfile: "bash",
  makefile: "bash",
  cmakelists: "bash",
  gemfile: "ruby",
  rakefile: "ruby",
  procfile: "bash",
  vagrantfile: "ruby",
  justfile: "bash",
  brewfile: "ruby",
};

/** Dot-prefixed filenames that should be treated as text/config */
const DOTFILE_LANGUAGE: Record<string, Language> = {
  ".gitignore": "bash",
  ".gitattributes": "bash",
  ".gitmodules": "bash",
  ".dockerignore": "bash",
  ".editorconfig": "bash",
  ".prettierrc": "json",
  ".eslintrc": "json",
  ".babelrc": "json",
  ".npmrc": "bash",
  ".nvmrc": "bash",
  ".env": "bash",
  ".env.local": "bash",
  ".env.example": "bash",
  ".env.development": "bash",
  ".env.production": "bash",
  ".env.test": "bash",
  ".prettierignore": "bash",
  ".eslintignore": "bash",
  ".browserslistrc": "bash",
  ".yarnrc": "bash",
  ".tool-versions": "bash",
  ".ruby-version": "bash",
  ".node-version": "bash",
  ".python-version": "bash",
};

export type FileType = "text" | "image" | "binary" | "unknown";

export function detectLanguageFromName(name: string): Language | undefined {
  const lower = name.toLowerCase();

  // Check exact filename matches (Dockerfile, Makefile, etc.)
  if (FILENAME_LANGUAGE[lower]) return FILENAME_LANGUAGE[lower];

  // Check dotfile matches (.gitignore, .dockerignore, .env, etc.)
  if (DOTFILE_LANGUAGE[lower]) return DOTFILE_LANGUAGE[lower];

  // Check dotfile prefix patterns (.env.something)
  if (lower.startsWith(".env")) return "bash";

  const ext = lower.split(".").pop();
  return ext ? EXTENSION_LANGUAGE[ext] : undefined;
}

export function detectFileType(name: string): FileType {
  const lower = name.toLowerCase();

  // Extensionless files that are text
  if (FILENAME_LANGUAGE[lower]) return "text";
  // Dotfiles that are text
  if (DOTFILE_LANGUAGE[lower]) return "text";
  if (lower.startsWith(".env")) return "text";

  const ext = lower.split(".").pop();
  if (!ext) return "text"; // Default extensionless files to text

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "avif", "svg", "ico"];
  const binaryExts = ["pdf", "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "woff", "woff2", "ttf", "eot", "otf", "mp3", "wav", "ogg", "flac", "aac", "m4a", "mp4", "webm", "avi", "mov", "mkv", "wasm", "exe", "dll", "so", "dylib", "o", "a", "class", "jar", "war", "pyc", "pyo", "pyd"];

  if (imageExts.includes(ext)) return "image";
  if (binaryExts.includes(ext)) return "binary";
  if (EXTENSION_LANGUAGE[ext]) return "text";
  return "text";
}

const TWO_SPACE_LANGUAGES = new Set<Language>([
  "typescript",
  "javascript",
  "html",
  "css",
  "json",
]);

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
