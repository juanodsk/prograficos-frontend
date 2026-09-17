import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Search, X } from "lucide-react";

const fullName = (operator) =>
  `${operator.name || ""} ${operator.surename || ""}`.trim() ||
  operator.email ||
  `Usuario #${operator.id}`;

// Multi-select de operarios: chips de seleccionados + Popover con lista
// buscable de checkboxes. `value` es un array de ids; `onChange` recibe el
// nuevo array.
export default function OperatorMultiSelect({
  operators = [],
  value = [],
  onChange,
  disabled = false,
  useBadge = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOperators = useMemo(
    () => operators.filter((operator) => value.includes(operator.id)),
    [operators, value],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return operators;
    return operators.filter(
      (operator) =>
        fullName(operator).toLowerCase().includes(query) ||
        operator.email?.toLowerCase().includes(query),
    );
  }, [operators, search]);

  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((current) => current !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      {useBadge && selectedOperators.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOperators.map((operator) => (
            <Badge key={operator.id} variant="secondary" className="gap-1">
              {fullName(operator)}
              <button
                type="button"
                onClick={() => toggle(operator.id)}
                className="cursor-pointer opacity-70 hover:opacity-100"
                aria-label={`Quitar ${fullName(operator)}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={value.length ? "text-foreground" : "text-muted-foreground"}>
            {value.length
              ? `${value.length} operario(s) seleccionado(s)`
              : "Seleccionar operarios"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar operario..."
              className="h-7 w-full border-0 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No hay operarios activos.
              </p>
            ) : (
              filtered.map((operator) => (
                <button
                  key={operator.id}
                  type="button"
                  onClick={() => toggle(operator.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
                >
                  <Checkbox
                    checked={value.includes(operator.id)}
                    className="pointer-events-none"
                    tabIndex={-1}
                  />
                  <span className="text-sm">{fullName(operator)}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
