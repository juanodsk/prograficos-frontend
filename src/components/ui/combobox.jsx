import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ComboboxContext = React.createContext(null);

function Combobox({
  items = [],
  itemToStringValue,
  value,
  onValueChange,
  disabled = false,
  children,
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef(null);
  const listRef = React.useRef(null);

  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    const query = search.toLowerCase();
    return items.filter((item) => {
      const str = itemToStringValue ? itemToStringValue(item) : String(item);
      return str.toLowerCase().includes(query);
    });
  }, [items, search, itemToStringValue]);

  const isSelected = React.useCallback(
    (item) => {
      if (value == null) return false;
      if (itemToStringValue) {
        return itemToStringValue(item) === itemToStringValue(value);
      }
      return item === value;
    },
    [value, itemToStringValue],
  );

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const options = listRef.current.querySelectorAll('[role="option"]');
    options[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const selectItem = React.useCallback(
    (item) => {
      onValueChange?.(item);
      setOpen(false);
      setSearch("");
    },
    [onValueChange],
  );

  const clearItem = React.useCallback(
    (e) => {
      e.stopPropagation();
      onValueChange?.(null);
      setSearch("");
    },
    [onValueChange],
  );

  const handleInputKeyDown = React.useCallback(
    (e) => {
      const len = filteredItems.length;

      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % len);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + len) % len);
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < len) {
            selectItem(filteredItems[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          setSearch("");
          break;
      }
    },
    [open, highlightedIndex, filteredItems, selectItem],
  );

  const ctx = React.useMemo(
    () => ({
      items: filteredItems,
      listRef,
      itemToStringValue,
      value,
      disabled,
      open,
      setOpen,
      search,
      setSearch,
      highlightedIndex,
      setHighlightedIndex,
      isSelected,
      selectItem,
      clearItem,
      handleInputKeyDown,
    }),
    [
      filteredItems,
      itemToStringValue,
      value,
      disabled,
      open,
      search,
      highlightedIndex,
      isSelected,
      selectItem,
      clearItem,
      handleInputKeyDown,
    ],
  );

  return (
    <ComboboxContext.Provider value={ctx}>
      <div ref={containerRef} className={cn("relative", className)}>
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

function ComboboxInput({ className, placeholder, showClear, ...props }) {
  const ctx = React.useContext(ComboboxContext);

  const displayValue =
    ctx.search ||
    (ctx.value && ctx.itemToStringValue
      ? ctx.itemToStringValue(ctx.value)
      : "");

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={ctx.open}
        aria-haspopup="listbox"
        type="text"
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-transparent py-2 pl-2.5 pr-8 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          showClear && ctx.value && "pr-12",
          className,
        )}
        placeholder={placeholder}
        disabled={ctx.disabled}
        value={displayValue}
        onChange={(e) => {
          ctx.setSearch(e.target.value);
          if (!ctx.open) ctx.setOpen(true);
        }}
        onFocus={() => {
          if (!ctx.open) ctx.setOpen(true);
        }}
        onClick={() => {
          if (!ctx.open) ctx.setOpen(true);
        }}
        onKeyDown={ctx.handleInputKeyDown}
        {...props}
      />
      <div className="absolute right-0 top-0 flex h-9 items-center gap-1 pr-2">
        {showClear && ctx.value && (
          <button
            type="button"
            tabIndex={-1}
            className="flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              ctx.clearItem(e);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          className="flex size-4 items-center justify-center text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (ctx.open) {
              ctx.setOpen(false);
              ctx.setSearch("");
            } else {
              ctx.setOpen(true);
            }
          }}
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ComboboxContent({ className, children, ...props }) {
  const ctx = React.useContext(ComboboxContext);
  if (!ctx.open) return null;

  return (
    <div
      data-slot="combobox-content"
      className={cn(
        "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ComboboxEmpty({ className, ...props }) {
  const ctx = React.useContext(ComboboxContext);
  if (ctx.items.length > 0) return null;

  return (
    <div
      data-slot="combobox-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxList({ className, children, ...props }) {
  const ctx = React.useContext(ComboboxContext);

  return (
    <div
      ref={ctx.listRef}
      data-slot="combobox-list"
      className={cn("max-h-72 overflow-y-auto p-1", className)}
      role="listbox"
      {...props}
    >
      {ctx.items.length === 0
        ? null
        : ctx.items.map((item, index) => {
            const selected = ctx.isSelected(item);
            const key = ctx.itemToStringValue
              ? ctx.itemToStringValue(item)
              : String(item);

            return (
              <div
                key={key}
                role="option"
                aria-selected={selected}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
                  index === ctx.highlightedIndex &&
                    "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => ctx.setHighlightedIndex(index)}
                onClick={() => ctx.selectItem(item)}
              >
                <span className="absolute right-2 flex size-4 items-center justify-center">
                  {selected && <Check className="size-4" />}
                </span>
                <span className="pr-6">
                  {typeof children === "function"
                    ? children(item)
                    : children}
                </span>
              </div>
            );
          })}
    </div>
  );
}

function ComboboxItem({ className, children, ...props }) {
  return (
    <span
      data-slot="combobox-item"
      className={cn("truncate", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
};
