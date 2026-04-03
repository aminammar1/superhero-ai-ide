"use client";

import { useState } from "react";
import {
  ChevronRight,
  File,
  FolderOpen,
  FolderClosed,
  Plus,
  Trash2,
} from "lucide-react";
import { useFileStore, type FileNode } from "@/store/file-store";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function FileExplorer() {
  const files = useFileStore((s) => s.files);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const expandedFolders = useFileStore((s) => s.expandedFolders);
  const setActiveFile = useFileStore((s) => s.setActiveFile);
  const toggleFolder = useFileStore((s) => s.toggleFolder);
  const createNode = useFileStore((s) => s.createNode);
  const deleteNode = useFileStore((s) => s.deleteNode);
  const setCode = useAppStore((s) => s.setCode);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const getFileById = useFileStore((s) => s.getFileById);

  const [showInput, setShowInput] = useState<{
    parentId: string | null;
    type: "file" | "folder";
  } | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleOpenFile = (node: FileNode) => {
    if (node.type !== "file") return;
    setActiveFile(node.id);
    if (node.content !== undefined) setCode(node.content);
    if (node.language) setLanguage(node.language);
  };

  const handleCreate = () => {
    if (!inputValue.trim() || !showInput) return;
    createNode(showInput.parentId, inputValue.trim(), showInput.type);
    setInputValue("");
    setShowInput(null);
  };

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#0c0c10]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-white/30">
          EXPLORER
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              setShowInput({ parentId: null, type: "file" })
            }
            className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-white/[0.06] hover:text-white/50"
            title="New file"
          >
            <File className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() =>
              setShowInput({ parentId: null, type: "folder" })
            }
            className="flex h-6 w-6 items-center justify-center rounded text-white/25 hover:bg-white/[0.06] hover:text-white/50"
            title="New folder"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto py-1">
        {files.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            activeId={activeFileId}
            expanded={expandedFolders}
            onOpen={handleOpenFile}
            onToggle={toggleFolder}
            onDelete={deleteNode}
            onCreateIn={(parentId, type) =>
              setShowInput({ parentId, type })
            }
          />
        ))}

        {showInput && showInput.parentId === null && (
          <div className="flex items-center gap-1 px-3 py-1">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowInput(null);
              }}
              onBlur={handleCreate}
              placeholder={showInput.type === "file" ? "filename" : "folder"}
              className="w-full rounded border border-primary/30 bg-black/40 px-2 py-0.5 text-xs text-white/80 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activeId,
  expanded,
  onOpen,
  onToggle,
  onDelete,
  onCreateIn,
}: {
  node: FileNode;
  depth: number;
  activeId: string | null;
  expanded: Set<string>;
  onOpen: (n: FileNode) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateIn: (parentId: string, type: "file" | "folder") => void;
}) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.id);
  const isActive = node.id === activeId;
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 cursor-pointer py-[3px] pr-2 transition-colors",
          isActive
            ? "bg-primary/10 text-white/90"
            : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"
        )}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={() => (isFolder ? onToggle(node.id) : onOpen(node))}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform",
                isOpen && "rotate-90"
              )}
            />
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400/60" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-400/40" />
            )}
          </>
        ) : (
          <File className="ml-3 h-3.5 w-3.5 shrink-0 text-blue-400/40" />
        )}
        <span className="truncate text-xs">{node.name}</span>

        {hovered && (
          <div className="ml-auto flex shrink-0 gap-0.5">
            {isFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateIn(node.id, "file");
                }}
                className="flex h-4 w-4 items-center justify-center rounded text-white/30 hover:text-white/60"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="flex h-4 w-4 items-center justify-center rounded text-white/20 hover:text-red-400/60"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>

      {isFolder && isOpen && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activeId={activeId}
          expanded={expanded}
          onOpen={onOpen}
          onToggle={onToggle}
          onDelete={onDelete}
          onCreateIn={onCreateIn}
        />
      ))}
    </>
  );
}
