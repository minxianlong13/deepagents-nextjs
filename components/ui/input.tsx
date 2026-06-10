import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-base text-black shadow-xs transition-colors outline-none placeholder:text-black/45 focus-visible:ring-2 focus-visible:ring-black/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
