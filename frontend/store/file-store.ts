"use client";

import { create } from "zustand";
import type { Language } from "@/lib/types";

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
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, Language> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
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
    json: "json",
    rs: "rust",
    rb: "ruby",
    php: "php",
    swift: "swift",
    sh: "bash",
    bash: "bash",
  };
  return ext ? map[ext] : undefined;
}

/* ────────────────────────────────────────────
   Clean workspace — no example files
   ──────────────────────────────────────────── */
const DEFAULT_FILES: FileNode[] = [];

interface FileStore {
  files: FileNode[];
  activeFileId: string | null;
  expandedFolders: Set<string>;
  setActiveFile: (id: string) => void;
  toggleFolder: (id: string) => void;
  createNode: (parentId: string | null, name: string, type: "file" | "folder") => void;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  updateFileContent: (id: string, content: string) => void;
  getFileById: (id: string) => FileNode | undefined;
  /** Replace entire tree from GitHub import (backend supplies content) */
  loadFromImportTree: (tree: ImportEntry[]) => void;
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
  if (parentId === null) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return { ...node, children: [...(node.children || []), newNode] };
    }
    if (node.children) {
      return { ...node, children: insertNode(node.children, parentId, newNode) };
    }
    return node;
  });
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
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children) return { ...node, children: updateNode(node.children, id, updater) };
    return node;
  });
}

import { persist } from "zustand/middleware";

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
        const convertTree = (entries: ImportEntry[], parentId: string | null): FileNode[] => {
          return entries.map((entry) => {
            const id = crypto.randomUUID();
            if (entry.type === "folder") {
              return {
                id,
                name: entry.name,
                type: "folder" as const,
                parentId,
                children: entry.children ? convertTree(entry.children, id) : [],
              };
            }
            return {
              id,
              name: entry.name,
              type: "file" as const,
              parentId,
              language: detectLanguage(entry.name),
              content: entry.content ?? "",
            };
          });
        };

        const files = convertTree(tree, null);
        // Auto-expand top-level folders
        const topFolders = new Set(files.filter((f) => f.type === "folder").map((f) => f.id));
        set({ files, activeFileId: null, expandedFolders: topFolders });
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
        expandedFolders: new Set(persistedState?.expandedFolders || []),
      }),
    }
  )
);
