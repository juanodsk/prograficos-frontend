import * as React from "react";

import { cn } from "@/lib/utils";

// Field primitives (estilo shadcn, adaptadas a este proyecto JSX + Base UI).
// Semántica accesible: FieldSet => <fieldset>, FieldLegend => <legend>.

function FieldSet({ className, ...props }) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4",
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({ className, variant = "legend", ...props }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "px-1 font-medium text-slate-700",
        variant === "legend" ? "text-sm" : "text-xs uppercase tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function Field({ className, orientation = "vertical", ...props }) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        orientation === "horizontal"
          ? "flex items-center gap-2"
          : "flex flex-col gap-1",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-xs font-medium text-slate-700", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-slate-500", className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function FieldSeparator({ className, ...props }) {
  return (
    <div
      data-slot="field-separator"
      className={cn("h-px w-full bg-slate-200", className)}
      {...props}
    />
  );
}

export {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  FieldSeparator,
};
