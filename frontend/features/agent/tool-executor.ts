"use client";

import { useFileStore } from "@/store/file-store";
import { useAgentStore, type AgentToolCall, type AgentToolName } from "@/store/agent-store";
import { writeWorkspaceFile, deleteWorkspaceFile } from "@/services/api";

/* ────────────────────────────────────────────
   Parse agent response for tool calls
   ──────────────────────────────────────────── */

/**
 * Parses structured tool calls from the AI response.
 * Format: [TOOL:tool_name(arg1="value1", arg2="value2")]
 * Also supports legacy format: [CREATE: filename], [DELETE: filename], etc.
 */
export function parseToolCalls(text: string): { cleanText: string; toolCalls: AgentToolCall[] } {
  const toolCalls: AgentToolCall[] = [];
  const cleanupRanges: Array<{ start: number; end: number }> = [];

  const structuredCalls = extractStructuredToolCalls(text);
  for (const call of structuredCalls) {
    toolCalls.push(call.toolCall);
    cleanupRanges.push({ start: call.start, end: call.end });
  }

  // Legacy format support
  let match: RegExpExecArray | null;
  const legacyPatterns = [
    { regex: /\[CREATE:\s*(.*?)\]/g, tool: "create_file" as AgentToolName },
    { regex: /\[DELETE:\s*(.*?)\]/g, tool: "delete_file" as AgentToolName },
    { regex: /\[EDIT:\s*(.*?)\]/g, tool: "modify_file" as AgentToolName },
    { regex: /\[FOLDER:\s*(.*?)\]/g, tool: "create_folder" as AgentToolName },
  ];

  for (const { regex, tool } of legacyPatterns) {
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        toolCalls.push({
          id: crypto.randomUUID(),
          tool,
          args: { path: match[1].trim() },
        });
        cleanupRanges.push({ start: match.index, end: match.index + match[0].length - 1 });
      }
    }
  }

  const cleanText = stripRanges(text, cleanupRanges).trim();

  return { cleanText, toolCalls };
}

function extractStructuredToolCalls(text: string): Array<{
  toolCall: AgentToolCall;
  start: number;
  end: number;
}> {
  const calls: Array<{ toolCall: AgentToolCall; start: number; end: number }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf("[TOOL:", cursor);
    if (start === -1) break;

    let i = start + 6;
    while (i < text.length && /\s/.test(text[i])) i++;

    const toolStart = i;
    while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) i++;
    const toolName = text.slice(toolStart, i);
    if (!toolName) {
      cursor = start + 6;
      continue;
    }

    if (text[i] !== "(") {
      cursor = start + 6;
      continue;
    }

    i += 1; // move after opening parenthesis
    const argsStart = i;
    let depth = 1;
    let inQuote = false;
    let escaped = false;

    for (; i < text.length; i++) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\" && inQuote) {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inQuote = !inQuote;
        continue;
      }

      if (inQuote) continue;

      if (ch === "(") {
        depth += 1;
      } else if (ch === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    if (depth !== 0) {
      cursor = start + 6;
      continue;
    }

    const argsEnd = i;
    const closingBracketIndex = i + 1;
    if (closingBracketIndex >= text.length || text[closingBracketIndex] !== "]") {
      cursor = start + 6;
      continue;
    }

    const args = parseToolArgs(text.slice(argsStart, argsEnd));
    calls.push({
      toolCall: {
        id: crypto.randomUUID(),
        tool: toolName as AgentToolName,
        args,
      },
      start,
      end: closingBracketIndex,
    });

    cursor = closingBracketIndex + 1;
  }

  return calls;
}

function parseToolArgs(argsStr: string): Record<string, string> {
  const args: Record<string, string> = {};
  const argRegex = /(\w+)="((?:\\.|[^"\\])*)"/g;
  let argMatch: RegExpExecArray | null;

  while ((argMatch = argRegex.exec(argsStr)) !== null) {
    const key = argMatch[1];
    const value = argMatch[2].replace(/\\"/g, '"');
    args[key] = value;
  }

  return args;
}

function stripRanges(text: string, ranges: Array<{ start: number; end: number }>): string {
  if (ranges.length === 0) return text;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end + 1) {
      merged.push({ ...range });
      continue;
    }
    last.end = Math.max(last.end, range.end);
  }

  let result = "";
  let cursor = 0;
  for (const range of merged) {
    result += text.slice(cursor, range.start);
    cursor = range.end + 1;
  }
  result += text.slice(cursor);

  return result;
}

/* ────────────────────────────────────────────
   Execute approved tool calls
   ──────────────────────────────────────────── */
export function executeToolCall(toolCall: AgentToolCall): { success: boolean; message: string } {
  const fileStore = useFileStore.getState();
  const { tool, args } = toolCall;

  try {
    switch (tool) {
      case "create_file": {
        const path = args.path || args.name;
        if (!path) return { success: false, message: "No file path specified" };
        const rawContent = args.content || toolCall.preview || "";
        // Unescape \\n sequences from AI output
        const content = rawContent.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

        // Determine parent folder and file name
        const parts = path.split("/");
        const fileName = parts.pop() || path;
        let parentId: string | null = null;

        // Create intermediate folders if needed
        if (parts.length > 0) {
          for (const folderName of parts) {
            const existing = findNodeByName(fileStore.files, folderName, parentId);
            if (existing) {
              parentId = existing.id;
            } else {
              const folderId = crypto.randomUUID();
              fileStore.createNode(parentId, folderName, "folder");
              // Find the just-created folder
              const created = findNodeByName(useFileStore.getState().files, folderName, parentId);
              if (created) parentId = created.id;
            }
          }
        }

        fileStore.createNode(parentId, fileName, "file");

        // If content was provided, update the file
        if (content) {
          const newFile = findNodeByName(useFileStore.getState().files, fileName, parentId);
          if (newFile) {
            fileStore.updateFileContent(newFile.id, content);
          }
        }
        // Sync to backend workspace
        void writeWorkspaceFile(path, content);

        return { success: true, message: `Created file: ${path}` };
      }


      case "create_folder": {
        const path = args.path || args.name;
        if (!path) return { success: false, message: "No folder path specified" };

        const parts = path.split("/");
        let parentId: string | null = null;
        for (const folderName of parts) {
          const existing = findNodeByName(fileStore.files, folderName, parentId);
          if (existing) {
            parentId = existing.id;
          } else {
            fileStore.createNode(parentId, folderName, "folder");
            const created = findNodeByName(useFileStore.getState().files, folderName, parentId);
            if (created) parentId = created.id;
          }
        }

        return { success: true, message: `Created folder: ${path}` };
      }


      case "delete_file": {
        const path = args.path || args.name;
        if (!path) return { success: false, message: "No file path specified" };

        const node = findNodeByPath(fileStore.files, path);
        if (!node) return { success: false, message: `File not found: ${path}` };

        fileStore.deleteNode(node.id);
        // Sync delete to backend workspace
        void deleteWorkspaceFile(path);
        return { success: true, message: `Deleted: ${path}` };
      }

      case "modify_file": {
        const path = args.path || args.name;
        const rawContent = args.content || toolCall.preview || "";
        const content = rawContent.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
        if (!path) return { success: false, message: "No file path specified" };

        const node = findNodeByPath(fileStore.files, path);
        if (!node) return { success: false, message: `File not found: ${path}` };

        fileStore.updateFileContent(node.id, content);
        fileStore.setActiveFile(node.id);
        // Sync to backend workspace
        void writeWorkspaceFile(path, content);
        return { success: true, message: `Modified: ${path}` };
      }

      case "read_file": {
        const path = args.path || args.name;
        if (!path) return { success: false, message: "No file path specified" };

        const node = findNodeByPath(fileStore.files, path);
        if (!node) return { success: false, message: `File not found: ${path}` };

        return { success: true, message: node.content || "(empty file)" };
      }

      case "list_files": {
        const listing = buildFileListing(fileStore.files, 0);
        return { success: true, message: listing || "(empty workspace)" };
      }

      default:
        return { success: false, message: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Execution failed" };
  }
}

/* ────────────────────────────────────────────
   Helper functions
   ──────────────────────────────────────────── */
function findNodeByName(
  nodes: import("@/store/file-store").FileNode[],
  name: string,
  parentId: string | null
): import("@/store/file-store").FileNode | undefined {
  for (const node of nodes) {
    if (node.name === name && node.parentId === parentId) return node;
    if (node.children) {
      const found = findNodeByName(node.children, name, parentId);
      if (found) return found;
    }
  }
  return undefined;
}

function findNodeByPath(
  nodes: import("@/store/file-store").FileNode[],
  path: string
): import("@/store/file-store").FileNode | undefined {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return undefined;

  // Walk the tree segment by segment
  let currentLevel = nodes;
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    const match = currentLevel.find((n) => n.name === segment);
    if (!match) return undefined;
    if (i === parts.length - 1) return match;
    if (match.children) {
      currentLevel = match.children;
    } else {
      return undefined;
    }
  }

  return undefined;
}

function buildFileListing(nodes: import("@/store/file-store").FileNode[], depth: number): string {
  let result = "";
  for (const node of nodes) {
    const indent = "  ".repeat(depth);
    const prefix = node.type === "folder" ? "[dir]" : "[file]";
    result += `${indent}${prefix} ${node.name}\n`;
    if (node.children) {
      result += buildFileListing(node.children, depth + 1);
    }
  }
  return result;
}

/**
 * Checks if any tool calls require user approval (destructive actions).
 * Safe read-only actions like read_file and list_files are auto-approved.
 */
export function requiresApproval(tool: AgentToolName): boolean {
  return !["read_file", "list_files"].includes(tool);
}
