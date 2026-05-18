export function summarizeAssistantOutput(text: string, toolCount = 0): string {
  const withoutToolTags = text.replace(/\[TOOL:[\s\S]*?\]/g, "").trim();
  const withoutCodeBlocks = withoutToolTags.replace(/```[\s\S]*?```/g, "").trim();
  const lines = withoutCodeBlocks
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !looksLikeRawCode(line));

  const summary = lines.join(" ").replace(/\s+/g, " ").trim();
  if (summary) return clampSentence(summary);

  if (toolCount === 1) return "Workspace updated.";
  if (toolCount > 1) return `${toolCount} workspace updates completed.`;
  return "Task complete.";
}

function looksLikeRawCode(line: string): boolean {
  return (
    /^(import|export|const|let|var|function|class|interface|type)\b/.test(line) ||
    /^<\/?[A-Za-z][^>]*>$/.test(line) ||
    /^[{}()[\];,]+$/.test(line) ||
    /=>|;\s*$/.test(line)
  );
}

function clampSentence(text: string): string {
  const firstSentence = text.match(/^(.{1,220}?[.!?])\s/)?.[1];
  if (firstSentence) return firstSentence;
  return text.length > 220 ? `${text.slice(0, 217).trim()}...` : text;
}
