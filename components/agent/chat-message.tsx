import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage, HeroTheme } from "@/lib/types";
import { heroThemeMap } from "@/themes/superheroes";

export function ChatMessageBubble({
  message,
  theme
}: {
  message: ChatMessage;
  theme: HeroTheme;
}) {
  const hero = heroThemeMap[theme];
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-3", !isAssistant && "justify-end")}>
      {isAssistant ? (
        <Avatar className="border border-white/10">
          <AvatarImage src={hero.asset} alt={hero.name} />
          <AvatarFallback>{hero.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6",
          isAssistant ? "border border-white/10 bg-white/5" : "bg-primary text-primary-foreground"
        )}
      >
        {message.content || "Thinking..."}
      </div>
    </div>
  );
}
