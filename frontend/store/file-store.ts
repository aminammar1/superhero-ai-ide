"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/lib/types";
import {
  detectLanguageFromName,
  normalizeGeneratedCode,
  normalizeWorkspacePath,
} from "@/lib/code-format";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: Language;
  content?: string;
  children?: FileNode[];
  parentId: string | null;
}

function detectLanguage(name: string): Language | undefined {
  return detectLanguageFromName(name);
}

/* ────────────────────────────────────────────
   Clean workspace — no example files
   ──────────────────────────────────────────── */
const DEFAULT_FILES: FileNode[] = [];

interface FileStore {
  files: FileNode[];
  activeFileId: string | null;
  expandedFolders: Set<string>;
  setActiveFile: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  createNode: (parentId: string | null, name: string, type: "file" | "folder") => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  updateFileContent: (id: string, content: string) => void;
  getFileById: (id: string) => FileNode | undefined;
  /** Replace entire tree from GitHub import (backend supplies content) */
  loadFromImportTree: (tree: ImportEntry[]) => void;
  /** Refresh tree from backend without closing the currently-open file when possible */
  refreshFromImportTree: (tree: ImportEntry[]) => void;
}

/** Shape returned by the executor import-github endpoint */
export interface ImportEntry {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  content?: string;
  children?: ImportEntry[];
}

function findNode(nodes: FileNode[], id: string): FileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function insertNode(nodes: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (parentId === null) return sortFileNodes([...nodes, newNode]);
  return sortFileNodes(nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return { ...node, children: sortFileNodes([...(node.children || []), newNode]) };
    }
    if (node.children) {
      return { ...node, children: insertNode(node.children, parentId, newNode) };
    }
    return node;
  }));
}

function removeNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children ? { ...node, children: removeNode(node.children, id) } : node
    );
}

function collectSubtreeIds(nodes: FileNode[], id: string): Set<string> {
  const ids = new Set<string>();

  const walk = (node: FileNode) => {
    ids.add(node.id);
    if (node.children) {
      for (const child of node.children) {
        walk(child);
      }
    }
  };

  const find = (items: FileNode[]) => {
    for (const node of items) {
      if (node.id === id) {
        walk(node);
        return true;
      }
      if (node.children && find(node.children)) {
        return true;
      }
    }
    return false;
  };

  find(nodes);
  return ids;
}

function updateNode(nodes: FileNode[], id: string, updater: (n: FileNode) => FileNode): FileNode[] {
  return sortFileNodes(nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children) return { ...node, children: updateNode(node.children, id, updater) };
    return node;
  }));
}

const CONFIG_FILE_NAMES = new Set([
  ".babelrc",
  ".dockerignore",
  ".editorconfig",
  ".env",
  ".env.example",
  ".eslintrc",
  ".gitignore",
  ".prettierrc",
  "components.json",
  "eslint.config.js",
  "eslint.config.mjs",
  "next.config.js",
  "next.config.mjs",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "postcss.config.js",
  "postcss.config.mjs",
  "readme.md",
  "tailwind.config.js",
  "tailwind.config.ts",
  "tsconfig.json",
  "vite.config.js",
  "vite.config.ts",
  "yarn.lock",
]);

function isConfigFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    CONFIG_FILE_NAMES.has(lower) ||
    lower.startsWith(".env.") ||
    lower.includes(".config.") ||
    lower.endsWith("rc.json") ||
    lower.endsWith("rc.js") ||
    lower.endsWith("rc.mjs")
  );
}

function fileSortBucket(entry: Pick<FileNode | ImportEntry, "name" | "type">): number {
  if (entry.type === "folder") return 0;
  return isConfigFileName(entry.name) ? 2 : 1;
}

function compareEntries(
  a: Pick<FileNode | ImportEntry, "name" | "type">,
  b: Pick<FileNode | ImportEntry, "name" | "type">
): number {
  const bucketDelta = fileSortBucket(a) - fileSortBucket(b);
  if (bucketDelta !== 0) return bucketDelta;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function sortFileNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes]
    .sort(compareEntries)
    .map((node) =>
      node.children ? { ...node, children: sortFileNodes(node.children) } : node
    );
}

function sortImportEntries(entries: ImportEntry[]): ImportEntry[] {
  return [...entries].sort(compareEntries);
}

function findNodePath(nodes: FileNode[], id: string, parentPath = ""): string | null {
  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.id === id) return path;
    if (node.children) {
      const found = findNodePath(node.children, id, path);
      if (found) return found;
    }
  }
  return null;
}

function collectExpandedFolderPaths(
  nodes: FileNode[],
  expandedFolders: Set<string>,
  parentPath = "",
  paths = new Set<string>()
): Set<string> {
  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === "folder" && expandedFolders.has(node.id)) {
      paths.add(path);
    }
    if (node.children) {
      collectExpandedFolderPaths(node.children, expandedFolders, path, paths);
    }
  }
  return paths;
}

function convertImportTree(
  entries: ImportEntry[],
  parentId: string | null,
  pathToId: Map<string, string>
): FileNode[] {
  return sortImportEntries(entries).map((entry) => {
    const id = crypto.randomUUID();
    const path = normalizeWorkspacePath(entry.path || entry.name);
    pathToId.set(path, id);

    if (entry.type === "folder") {
      return {
        id,
        name: entry.name,
        type: "folder" as const,
        parentId,
        children: entry.children ? convertImportTree(entry.children, id, pathToId) : [],
      };
    }
    return {
      id,
      name: entry.name,
      type: "file" as const,
      parentId,
      language: detectLanguage(entry.name),
      content: entry.content !== undefined ? normalizeGeneratedCode(path, entry.content) : "",
    };
  });
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      files: DEFAULT_FILES,
      activeFileId: null,
      expandedFolders: new Set<string>(),

      setActiveFile: (id) => set({ activeFileId: id }),
      toggleFolder: (id) =>
        set((state) => {
          const next = new Set(state.expandedFolders);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { expandedFolders: next };
        }),
      createNode: (parentId, name, type) =>
        set((state) => {
          const newNode: FileNode = {
            id: crypto.randomUUID(),
            name,
            type,
            parentId,
            language: type === "file" ? detectLanguage(name) : undefined,
            content: type === "file" ? "" : undefined,
            children: type === "folder" ? [] : undefined,
          };
          const expanded = new Set(state.expandedFolders);
          if (parentId) expanded.add(parentId);
          return { files: insertNode(state.files, parentId, newNode), expandedFolders: expanded };
        }),
      deleteNode: (id) =>
        set((state) => {
          const removedIds = collectSubtreeIds(state.files, id);
          return {
            files: removeNode(state.files, id),
            activeFileId:
              state.activeFileId && removedIds.has(state.activeFileId)
                ? null
                : state.activeFileId,
          };
        }),
      renameNode: (id, name) =>
        set((state) => ({
          files: updateNode(state.files, id, (n) => ({
            ...n,
            name,
            language: n.type === "file" ? detectLanguage(name) : n.language,
          })),
        })),
      updateFileContent: (id, content) =>
        set((state) => ({
          files: updateNode(state.files, id, (n) => ({ ...n, content })),
        })),
      getFileById: (id) => findNode(get().files, id),

      loadFromImportTree: (tree) => {
        const pathToId = new Map<string, string>();
        const files = convertImportTree(tree, null, pathToId);
        // Auto-expand top-level folders
        const topFolders = new Set(files.filter((f) => f.type === "folder").map((f) => f.id));
        set({ files, activeFileId: null, expandedFolders: topFolders });
      },

      refreshFromImportTree: (tree) => {
        const state = get();
        const activePath = state.activeFileId
          ? findNodePath(state.files, state.activeFileId)
          : null;
        const expandedPaths = collectExpandedFolderPaths(state.files, state.expandedFolders);
        const pathToId = new Map<string, string>();
        const files = convertImportTree(tree, null, pathToId);
        const topFolders = files.filter((f) => f.type === "folder").map((f) => f.id);
        const expandedFolders = new Set<string>(topFolders);

        for (const path of expandedPaths) {
          const id = pathToId.get(path);
          if (id) expandedFolders.add(id);
        }

        set({
          files,
          activeFileId: activePath ? pathToId.get(activePath) ?? null : null,
          expandedFolders,
        });
      },
    }),
    {
      name: "superhero-fs-storage-v2",
      partialize: (state) => ({
        files: state.files,
        activeFileId: state.activeFileId,
        expandedFolders: Array.from(state.expandedFolders),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        files: persistedState?.files ? sortFileNodes(persistedState.files) : currentState.files,
        expandedFolders: new Set(persistedState?.expandedFolders || []),
      }),
    }
  )
);
