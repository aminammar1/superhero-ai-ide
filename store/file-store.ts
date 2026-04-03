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
  };
  return ext ? map[ext] : undefined;
}

const DEFAULT_FILES: FileNode[] = [
  {
    id: "examples",
    name: "examples",
    type: "folder",
    parentId: null,
    children: [
      {
        id: "ex-ts",
        name: "hello.ts",
        type: "file",
        language: "typescript",
        parentId: "examples",
        content: `const greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet("Hero"));\n`,
      },
      {
        id: "ex-js",
        name: "hello.js",
        type: "file",
        language: "javascript",
        parentId: "examples",
        content: `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\nconsole.log("5! =", factorial(5));\n`,
      },
      {
        id: "ex-py",
        name: "hello.py",
        type: "file",
        language: "python",
        parentId: "examples",
        content: `def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nfor i in range(10):\n    print(f"fib({i}) = {fibonacci(i)}")\n`,
      },
      {
        id: "ex-go",
        name: "hello.go",
        type: "file",
        language: "go",
        parentId: "examples",
        content: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfor i := 1; i <= 10; i++ {\n\t\tfmt.Printf("%d squared is %d\\n", i, i*i)\n\t}\n}\n`,
      },
      {
        id: "ex-java",
        name: "Main.java",
        type: "file",
        language: "java",
        parentId: "examples",
        content: `public class Main {\n    public static void main(String[] args) {\n        String[] heroes = {"Spider-Man", "Batman", "Superman", "Iron Man"};\n        for (String hero : heroes) {\n            System.out.println("Hero: " + hero);\n        }\n    }\n}\n`,
      },
      {
        id: "ex-c",
        name: "hello.c",
        type: "file",
        language: "c",
        parentId: "examples",
        content: `#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 5; i++) {\n        printf("Line %d: Hello from C!\\n", i);\n    }\n    return 0;\n}\n`,
      },
      {
        id: "ex-cpp",
        name: "hello.cpp",
        type: "file",
        language: "cpp",
        parentId: "examples",
        content: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {5, 2, 8, 1, 9, 3};\n    std::sort(nums.begin(), nums.end());\n    for (int n : nums) {\n        std::cout << n << " ";\n    }\n    std::cout << std::endl;\n    return 0;\n}\n`,
      },
    ],
  },
  {
    id: "root-readme",
    name: "README.md",
    type: "file",
    parentId: null,
    content: "# My Project\n\nBuilt with SuperHero AI IDE.\n",
  },
];

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
      activeFileId: "ex-ts",
      expandedFolders: new Set(["examples"]),

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
        set((state) => ({
          files: removeNode(state.files, id),
          activeFileId: state.activeFileId === id ? null : state.activeFileId,
        })),
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
    }),
    {
      name: "superhero-fs-storage",
      partialize: (state) => ({
        files: state.files,
        activeFileId: state.activeFileId,
        expandedFolders: Array.from(state.expandedFolders), // Set is not serializable
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        expandedFolders: new Set(persistedState?.expandedFolders || []),
      }),
    }
  )
);
