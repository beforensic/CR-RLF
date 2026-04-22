import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
