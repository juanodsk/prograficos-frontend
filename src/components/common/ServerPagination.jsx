import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultPageSizeOptions = [10, 20, 50];

const ServerPagination = ({
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = defaultPageSizeOptions,
  itemLabel = "registros",
}) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span>
          Mostrando {start}-{end} de {total} {itemLabel}
        </span>

        {onPageSizeChange && (
          <>
            <span className="text-slate-300">|</span>
            <span>Por página</span>
            <select
              className="rounded-md border px-2 py-1 text-sm text-slate-700"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages || 1}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerPagination;
