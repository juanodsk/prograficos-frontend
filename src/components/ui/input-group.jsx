import * as React from "react";

import { cn } from "@/lib/utils";

// InputGroup (estilo shadcn, adaptado a este proyecto JSX + Base UI).
// Envuelve un input con "addons" a los lados (p. ej. "$" y "COP").

function InputGroup({ className, ...props }) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-9 w-full items-center overflow-hidden rounded-lg border border-input bg-white text-sm shadow-sm transition-colors focus-within:border-[#13529a] focus-within:ring-2 focus-within:ring-[#13529a]/20",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({ className, align = "inline-start", ...props }) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex h-full shrink-0 items-center bg-slate-100 px-2.5 text-slate-600",
        align === "inline-end"
          ? "border-l border-input"
          : "border-r border-input",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("text-xs font-semibold text-slate-600", className)}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText };
