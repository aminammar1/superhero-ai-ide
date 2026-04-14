"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ChevronRight,
  File,
  FolderOpen,
  FolderClosed,
  Plus,
  Trash2,
  FolderPlus,
  FileText,
  Pencil,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileStore, type FileNode } from "@/store/file-store";
import { useAppStore } from "@/store/app-store";
import { heroThemeMap } from "@/themes/superheroes";
import { HeroMotif } from "@/components/ui/hero-motif";
import { cn } from "@/lib/utils";

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeType: "file" | "folder";
}

function ContextMenu({
  state,
  onClose,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onNewFile: (parentId: string) => void;
  onNewFolder: (parentId: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const items = [
    ...(state.nodeType === "folder"
      ? [
        { label: "New File", icon: FileText, action: () => onNewFile(state.nodeId) },
        { label: "New Folder", icon: FolderPlus, action: () => onNewFolder(state.nodeId) },
        { type: "separator" as const },
      ]
      : []),
    { label: "Rename", icon: Pencil, action: () => onRename(state.nodeId) },
    { type: "separator" as const },
    { label: "Delete", icon: Trash2, action: () => onDelete(state.nodeId), danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a22] py-1 shadow-xl backdrop-blur-xl"
      style={{ left: state.x, top: state.y }}
    >
      {items.map((item, i) =>
        "type" in item && item.type === "separator" ? (
          <div key={i} className="my-1 h-px bg-white/[0.06]" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => {
              ("action" in item) && item.action?.();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-[11px] transition",
              "danger" in item && item.danger
                ? "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
            )}
          >
            {"icon" in item && item.icon && <item.icon className="h-3 w-3" />}
            {"label" in item && item.label}
          </button>
        )
      )}
    </div>
  );
}

export function FileExplorer() {
  const files = useFileStore((s) => s.files);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const expandedFolders = useFileStore((s) => s.expandedFolders);
  const setActiveFile = useFileStore((s) => s.setActiveFile);
  const toggleFolder = useFileStore((s) => s.toggleFolder);
  const createNode = useFileStore((s) => s.createNode);
  const deleteNode = useFileStore((s) => s.deleteNode);
  const renameNode = useFileStore((s) => s.renameNode);
  const setCode = useAppStore((s) => s.setCode);
  const setLanguageKeepCode = useAppStore((s) => s.setLanguageKeepCode);
  const theme = useAppStore((s) => s.theme);
  const hero = heroThemeMap[theme];

  const [showInput, setShowInput] = useState<{
    parentId: string | null;
    type: "file" | "folder";
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const openCreateInput = (parentId: string | null, type: "file" | "folder") => {
    setInputValue("");
    setShowInput({ parentId, type });
  };

  const cancelCreate = () => {
    setInputValue("");
    setShowInput(null);
  };

  const handleOpenFile = (node: FileNode) => {
    if (node.type !== "file") return;
    setActiveFile(node.id);
    if (node.content !== undefined) setCode(node.content);
    if (node.language) setLanguageKeepCode(node.language);
  };

  const handleCreate = () => {
    if (!showInput) return;
    const name = inputValue.trim();
    if (!name) {
      cancelCreate();
      return;
    }
    createNode(showInput.parentId, name, showInput.type);
    cancelCreate();
  };

  const handleRename = (id: string) => {
    const node = useFileStore.getState().getFileById(id);
    if (node) {
      setRenamingId(id);
      setRenameValue(node.name);
    }
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      renameNode(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string, nodeType: "file" | "folder") => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
  };

  const isEmpty = files.length === 0 && !showInput;

  return (
    <div
      className="flex h-full flex-col border-r bg-[#0c0c10] hero-edge-glow overflow-hidden"
      style={{
        borderColor: `rgba(var(--theme-primary-raw), 0.08)`,
      }}
    >
      {/* ───── HERO IDENTITY BADGE ───── */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          borderBottom: `1px solid rgba(var(--theme-primary-raw), 0.1)`,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(var(--theme-primary-raw), 0.06), transparent 70%)`,
          }}
        />

        {/* Hero motif watermark */}
        <HeroMotif
          theme={theme}
          className="right-[-20px] top-[-15px] h-[100px] w-[100px] text-primary !opacity-[0.08]"
        />

        <div className="relative flex items-center gap-3 px-3 py-3">
          {/* Hero avatar */}
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(var(--theme-primary-raw), 0.3), transparent 70%)`,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-primary/30">
              <Image
                src={hero.asset}
                alt={hero.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold tracking-wide text-white/85">
              {hero.name}
            </p>
            <p className="text-[9px] tracking-[0.15em] text-primary/50 font-mono">
              {hero.title.toUpperCase()}
            </p>
          </div>

          {/* Animated status dot */}
          <motion.div
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Color indicator bar */}
        <div className="flex h-[2px]">
          {hero.palette.map((color, i) => (
            <motion.div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            />
          ))}
        </div>
      </div>

      {/* ───── EXPLORER HEADER ───── */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
        <span className="text-[9px] font-semibold tracking-[0.25em] text-white/25 font-mono">
          WORKSPACE
        </span>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => openCreateInput(null, "file")}
            className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:bg-primary/10 hover:text-primary/60 transition"
            title="New file"
          >
            <FileText className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => openCreateInput(null, "folder")}
            className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:bg-primary/10 hover:text-primary/60 transition"
            title="New folder"
          >
            <FolderPlus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ───── FILE TREE ───── */}
      <div className="scrollbar-thin flex-1 overflow-auto py-1">
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <motion.div
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <HeroMotif
                theme={theme}
                className="relative h-12 w-12 text-primary !opacity-20"
              />
            </motion.div>
            <p className="text-[11px] text-white/20 leading-relaxed">
              Your workspace is empty
            </p>
            <p className="text-[10px] text-white/12">
              Create files or ask {hero.name} to set up a project
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => openCreateInput(null, "file")}
                className="flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-3 py-1.5 text-[10px] text-primary/40 transition hover:bg-primary/10 hover:text-primary/60"
              >
                <FileText className="h-3 w-3" />
                New File
              </button>
              <button
                type="button"
                onClick={() => openCreateInput(null, "folder")}
                className="flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-3 py-1.5 text-[10px] text-primary/40 transition hover:bg-primary/10 hover:text-primary/60"
              >
                <FolderPlus className="h-3 w-3" />
                New Folder
              </button>
            </div>
          </div>
        )}

        {/* File tree */}
        {files.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            activeId={activeFileId}
            expanded={expandedFolders}
            renamingId={renamingId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onRenameSubmit={handleRenameSubmit}
            onOpen={handleOpenFile}
            onToggle={toggleFolder}
            onContextMenu={handleContextMenu}
          />
        ))}

        {/* Root-level new input */}
        {showInput && (
          <div className="flex items-center gap-1 px-3 py-1">
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") cancelCreate();
              }}
              onBlur={handleCreate}
              placeholder={showInput.type === "file" ? "filename" : "folder"}
              className="w-full rounded border border-primary/30 bg-black/40 px-2 py-0.5 text-xs text-white/80 outline-none"
            />
          </div>
        )}
      </div>

      {/* ───── HERO QUICK ACTIONS ───── */}
      <div
        className="shrink-0 px-3 py-2"
        style={{
          borderTop: `1px solid rgba(var(--theme-primary-raw), 0.08)`,
          background: `linear-gradient(180deg, transparent, rgba(var(--theme-primary-raw), 0.02))`,
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-primary/30" />
          <span className="text-[9px] font-mono tracking-wider text-primary/25">
            {hero.name} AI READY
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={(id) => deleteNode(id)}
          onNewFile={(parentId) => openCreateInput(parentId, "file")}
          onNewFolder={(parentId) => openCreateInput(parentId, "folder")}
        />
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activeId,
  expanded,
  renamingId,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onOpen,
  onToggle,
  onContextMenu,
}: {
  node: FileNode;
  depth: number;
  activeId: string | null;
  expanded: Set<string>;
  renamingId: string | null;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onRenameSubmit: () => void;
  onOpen: (n: FileNode) => void;
  onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, type: "file" | "folder") => void;
}) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.id);
  const isActive = node.id === activeId;
  const isRenaming = node.id === renamingId;

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 cursor-pointer py-[3px] pr-2 transition-colors",
          isActive
            ? "bg-primary/10 text-white/90 border-r-2 border-primary/40"
            : "text-white/45 hover:bg-white/[0.04] hover:text-white/70"
        )}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={() => (isFolder ? onToggle(node.id) : onOpen(node))}
        onContextMenu={(e) => onContextMenu(e, node.id, node.type)}
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
          <File className="ml-3 h-3.5 w-3.5 shrink-0 text-primary/40" />
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit();
              if (e.key === "Escape") onRenameSubmit();
            }}
            onBlur={onRenameSubmit}
            className="flex-1 rounded border border-primary/30 bg-black/40 px-1 py-0 text-xs text-white/80 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-xs">{node.name}</span>
        )}
      </div>

      {isFolder && isOpen && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activeId={activeId}
          expanded={expanded}
          renamingId={renamingId}
          renameValue={renameValue}
          onRenameValueChange={onRenameValueChange}
          onRenameSubmit={onRenameSubmit}
          onOpen={onOpen}
          onToggle={onToggle}
          onContextMenu={onContextMenu}
        />
      ))}
    </>
  );
}
