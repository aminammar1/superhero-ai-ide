import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-white/20 focus:bg-white/10",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
