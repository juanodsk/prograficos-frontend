import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

// Multi-select con chips EN LÍNEA dentro del input + buscador integrado y
// dropdown. `items` arreglo de objetos; `value` arreglo de ids; `onChange`
// recibe el nuevo arreglo. `getId`/`getLabel` adaptan cualquier modelo.
export default function ComboboxChips({
  items = [],
  value = [],
  onChange,
  getId = (item) => item.id,
  getLabel = (item) => item.name,
  disabled = false,
  placeholder = "Seleccionar...",
  emptyText = "Sin resultados.",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => items.filter((item) => value.includes(getId(item))),
    [items, value, getId],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      String(getLabel(item)).toLowerCase().includes(query),
    );
  }, [items, search, getLabel]);

  // Cerrar el dropdown al hacer click fuera del componente.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    setSearch("");
    inputRef.current?.focus();
  };

  const removeChip = (id, e) => {
    e?.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Caja tipo input: chips + buscador en la misma línea */}
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-text focus-within:border-[#13529a] focus-within:ring-2 focus-within:ring-[#13529a]/20"
        }`}
      >
        {selected.map((item) => (
          <Badge key={getId(item)} variant="secondary" className="gap-1">
            {getLabel(item)}
            {!disabled && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => removeChip(getId(item), e)}
                className="cursor-pointer opacity-70 hover:opacity-100"
                aria-label={`Quitar ${getLabel(item)}`}
              >
                <X size={12} />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          disabled={disabled}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            // Backspace con el buscador vacío quita el último chip.
            if (e.key === "Backspace" && !search && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={selected.length ? "" : placeholder}
          className="h-6 min-w-[90px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            filtered.map((item) => {
              const checked = value.includes(getId(item));
              return (
                <button
                  key={getId(item)}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(getId(item))}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                    checked ? "font-medium" : ""
                  }`}
                >
                  <span>{getLabel(item)}</span>
                  {checked && <Check size={14} className="text-[#13529a]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
