import { cn } from "@/lib/utils";
import type { ChatMessage, HeroTheme } from "@/lib/types";
import { heroThemeMap } from "@/themes/superheroes";
import Image from "next/image";

export function ChatMessageBubble({
  message,
  theme,
}: {
  message: ChatMessage;
  theme: HeroTheme;
}) {
  const hero = heroThemeMap[theme];
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-2.5", !isAssistant && "justify-end")}>
      {isAssistant && (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/[0.08]">
          <Image
            src={hero.asset}
            alt={hero.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isAssistant
            ? "border border-white/[0.06] bg-white/[0.03] text-white/80"
            : "bg-primary/80 text-white"
        )}
      >
        {message.content || (
          <span className="inline-flex gap-1 text-white/30">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse" style={{ animationDelay: "150ms" }}>
              .
            </span>
            <span className="animate-pulse" style={{ animationDelay: "300ms" }}>
              .
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
