"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Code2, MessageSquare, Brain, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelOption } from "@/lib/ai-models";
import { CHAT_MODEL_OPTIONS } from "@/lib/ai-models";

/* ──────────────────────────────────────────────────────────────── */

const TAG_CONFIG: Record<string, { icon: typeof Code2; color: string; label: string }> = {
  premium: { icon: Brain,        color: "#f59e0b", label: "Premium" },
  code:    { icon: Code2,        color: "#a78bfa", label: "Code" },
  chat:    { icon: MessageSquare, color: "#60a5fa", label: "Chat" },
  reason:  { icon: Brain,        color: "#f472b6", label: "Reason" },
};

const PROVIDER_BADGE: Record<string, { color: string; label: string }> = {
  agentrouter: { color: "#f59e0b", label: "AR" },
  openrouter:  { color: "#8b5cf6", label: "OR" },
  nvidia:      { color: "#76b900", label: "NV" },
};

/* ──────────────────────────────────────────────────────────────── */

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  accentColor?: string;
}

/**
 * Inline model picker — sits inside the chat input bar.
 * Click to expand dropdown above with search and filter.
 * Styled like VS Code Copilot / Cursor model selector.
 */
export function ModelSelector({ value, onChange, accentColor = "#a78bfa" }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selected = CHAT_MODEL_OPTIONS.find((m) => m.id === value);

  const filteredModels = useMemo(() => {
    let models = CHAT_MODEL_OPTIONS;
    if (activeFilter) models = models.filter((m) => m.tag === activeFilter);
    if (!search.trim()) return models;
    const q = search.toLowerCase().trim();
    return models.filter((m) =>
      m.label.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q) ||
      (m.searchTags || []).some((t) => t.includes(q))
    );
  }, [search, activeFilter]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setActiveFilter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setSearch(""); setActiveFilter(null); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [open]);

  const handleSelect = useCallback((modelId: string) => {
    onChange(modelId);
    setOpen(false);
    setSearch("");
    setActiveFilter(null);
  }, [onChange]);

  const selectedTag = TAG_CONFIG[selected?.tag ?? "chat"] ?? TAG_CONFIG.chat;
  const SelectedIcon = selectedTag.icon;

  return (
    <div ref={containerRef} className="relative">
      {/* ─── Trigger ─── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
          open
            ? "bg-white/[0.08] text-white/70"
            : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
        )}
      >
        <SelectedIcon className="h-3 w-3" style={{ color: selectedTag.color }} />
        <span className="max-w-[100px] truncate">{selected?.label ?? "Model"}</span>
        <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-180")} />
      </button>

      {/* ─── Dropdown ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full mb-2 right-0 z-50 w-[300px]",
              "rounded-xl border border-white/[0.08]",
              "bg-[#0c0c12]/98 backdrop-blur-2xl",
              "shadow-[0_12px_48px_rgba(0,0,0,0.6)]",
              "overflow-hidden"
            )}
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
              <Search className="h-3 w-3 text-white/20 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="flex-1 bg-transparent text-[11px] text-white/75 outline-none placeholder:text-white/18"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-white/25 hover:text-white/50">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.04]">
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-semibold transition",
                  !activeFilter ? "bg-white/8 text-white/60" : "text-white/25 hover:text-white/40"
                )}
              >
                All
              </button>
              {Object.entries(TAG_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium transition",
                      activeFilter === key ? "bg-white/8 text-white/60" : "text-white/20 hover:text-white/40"
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" style={{ color: cfg.color }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="scrollbar-thin max-h-[260px] overflow-y-auto py-1">
              {filteredModels.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-white/15">No models found</div>
              ) : (
                filteredModels.map((model) => {
                  const isActive = model.id === value;
                  const tag = TAG_CONFIG[model.tag ?? "chat"] ?? TAG_CONFIG.chat;
                  const TagIcon = tag.icon;
                  const badge = PROVIDER_BADGE[model.provider] ?? PROVIDER_BADGE.openrouter;

                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelect(model.id)}
                      className={cn(
                        "group/m flex w-full items-center gap-2 px-3 py-1.5 text-left transition",
                        "hover:bg-white/[0.04]",
                        isActive && "bg-white/[0.05]"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                        style={{ background: `${tag.color}10` }}
                      >
                        <TagIcon className="h-2.5 w-2.5" style={{ color: tag.color }} />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "truncate text-[11px] font-medium",
                            isActive ? "text-white/85" : "text-white/55 group-hover/m:text-white/70"
                          )}>
                            {model.label}
                          </span>
                          <span
                            className="shrink-0 rounded px-1 py-px text-[7px] font-bold tracking-wider"
                            style={{
                              color: badge.color,
                              background: `${badge.color}15`,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {model.description && (
                          <span className="block truncate text-[9px] text-white/20">
                            {model.description}
                          </span>
                        )}
                      </div>

                      {isActive && <Check className="h-3 w-3 shrink-0" style={{ color: accentColor }} />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.04] px-3 py-1.5">
              <div className="flex items-center gap-2 text-[8px] text-white/15">
                <span style={{ color: PROVIDER_BADGE.agentrouter.color }}>● AgentRouter</span>
                <span style={{ color: PROVIDER_BADGE.openrouter.color }}>● OpenRouter</span>
                <span style={{ color: PROVIDER_BADGE.nvidia.color }}>● NVIDIA</span>
              </div>
              <span className="text-[8px] text-white/10">{CHAT_MODEL_OPTIONS.length} models</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
