"use client";

import { FileImage, FileArchive, FileAudio, FileVideo, FileCode, File, FileType as FileTypeIcon } from "lucide-react";
import type { FileType } from "@/lib/code-format";

const FILE_TYPE_ICONS: Record<string, typeof FileImage> = {
  image: FileImage,
  binary: FileArchive,
  audio: FileAudio,
  video: FileVideo,
  code: FileCode,
  unknown: FileTypeIcon,
};

function getFileCategory(fileType: FileType, mimeType?: string): string {
  if (fileType === "image") return "image";
  if (mimeType?.startsWith("audio/")) return "audio";
  if (mimeType?.startsWith("video/")) return "video";
  if (fileType === "binary") return "binary";
  return "unknown";
}

export function FileIcon({ fileType, mimeType, className }: { fileType?: FileType; mimeType?: string; className?: string }) {
  const category = getFileCategory(fileType || "unknown", mimeType);
  const Icon = FILE_TYPE_ICONS[category] || File;
  return <Icon className={className} />;
}

export function FilePreview({
  node,
}: {
  node: {
    name: string;
    content?: string;
    fileType?: FileType;
    mimeType?: string;
    size?: number;
  };
}) {
  const category = getFileCategory(node.fileType || "unknown", node.mimeType);

  if (category === "image" && node.content && node.mimeType) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0e] p-4">
        <img
          src={`data:${node.mimeType};base64,${node.content}`}
          alt={node.name}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
      </div>
    );
  }

  if (category === "audio" && node.mimeType) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0a0a0e] p-6">
        <FileAudio className="h-16 w-16 text-white/20" />
        <p className="text-sm text-white/40">{node.name}</p>
        {node.size && (
          <p className="text-xs text-white/20">{formatSize(node.size)}</p>
        )}
        <p className="text-[10px] text-white/15">Audio preview not available</p>
      </div>
    );
  }

  if (category === "video" && node.mimeType) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0a0a0e] p-6">
        <FileVideo className="h-16 w-16 text-white/20" />
        <p className="text-sm text-white/40">{node.name}</p>
        {node.size && (
          <p className="text-xs text-white/20">{formatSize(node.size)}</p>
        )}
        <p className="text-[10px] text-white/15">Video preview not available</p>
      </div>
    );
  }

  // PDF files
  if (node.mimeType === "application/pdf" || node.name.toLowerCase().endsWith(".pdf")) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0a0a0e] p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/5">
          <FileArchive className="h-10 w-10 text-red-400/40" />
        </div>
        <p className="text-sm font-medium text-white/50">{node.name}</p>
        {node.size && (
          <p className="text-xs text-white/20">{formatSize(node.size)}</p>
        )}
        <p className="text-[10px] text-white/15">PDF document — preview in external viewer</p>
      </div>
    );
  }

  if (category === "binary") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0a0a0e] p-6">
        <FileArchive className="h-16 w-16 text-white/20" />
        <p className="text-sm text-white/40">{node.name}</p>
        {node.size && (
          <p className="text-xs text-white/20">{formatSize(node.size)}</p>
        )}
        <p className="text-[10px] text-white/15">Binary file — no preview available</p>
      </div>
    );
  }

  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
