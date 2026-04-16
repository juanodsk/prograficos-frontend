import { useEffect, useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ServerPagination from "@/components/common/ServerPagination";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";

const DataTable = ({
  data = [],
  columns = [],
  actions,
  serverSide = false,
  storageKey,
  sortKey: controlledSortKey,
  sortDirection: controlledSortDirection = "asc",
  onSortChange,
  searchValue = "",
  onSearchChange,
  currentPage = 1,
  currentPageSize = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  itemLabel = "registros",
}) => {
  const readPersistedState = () => {
    if (typeof window === "undefined" || !storageKey || serverSide) {
      return {};
    }

    try {
      const rawValue = window.localStorage.getItem(
        `prograficos:datatable:${storageKey}`,
      );

      if (!rawValue) {
        return {};
      }

      const parsedValue = JSON.parse(rawValue);
      return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
    } catch {
      return {};
    }
  };

  const persistedState = readPersistedState();

  const [search, setSearch] = useState(() => persistedState.search ?? "");
  const [clientPage, setClientPage] = useState(
    () => persistedState.clientPage ?? 1,
  );
  const [clientPageSize, setClientPageSize] = useState(
    () => persistedState.clientPageSize ?? 10,
  );

  const [localSortKey, setLocalSortKey] = useState(
    () => persistedState.localSortKey ?? "id",
  );
  const [localSortDirection, setLocalSortDirection] = useState(
    () => persistedState.localSortDirection ?? "asc",
  );

  const isRemoteSort = serverSide && typeof onSortChange === "function";
  const activeSortKey = isRemoteSort ? controlledSortKey : localSortKey;
  const activeSortDirection = isRemoteSort
    ? controlledSortDirection
    : localSortDirection;

  useEffect(() => {
    if (serverSide || !storageKey || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        `prograficos:datatable:${storageKey}`,
        JSON.stringify({
          search,
          clientPage,
          clientPageSize,
          localSortKey,
          localSortDirection,
        }),
      );
    } catch {
      // Ignore storage errors and keep the table usable.
    }
  }, [
    clientPage,
    clientPageSize,
    localSortDirection,
    localSortKey,
    search,
    serverSide,
    storageKey,
  ]);

  const filteredData = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];

    if (serverSide) return arr;
    if (!search) return arr;

    return arr.filter((row) =>
      Object.values(row)
        .map((v) => String(v))
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [data, search, serverSide]);

  const sortedData = useMemo(() => {
    const arr = [...filteredData];

    if (isRemoteSort || (serverSide && !isRemoteSort) || !activeSortKey) {
      return arr;
    }

    return arr.sort((a, b) => {
      const A = a[activeSortKey];
      const B = b[activeSortKey];

      if (A === undefined || A === null) return 1;
      if (B === undefined || B === null) return -1;

      if (A < B) return activeSortDirection === "asc" ? -1 : 1;
      if (A > B) return activeSortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [activeSortDirection, activeSortKey, filteredData, isRemoteSort, serverSide]);

  const clientTotalPages = Math.ceil(sortedData.length / clientPageSize);

  const paginatedData = serverSide
    ? sortedData
    : sortedData.slice(
        (clientPage - 1) * clientPageSize,
        clientPage * clientPageSize,
      );

  const handleSort = (column) => {
    if (column?.sortable === false) return;

    const nextSortKey = column?.sortKey || column?.key;

    if (!nextSortKey) return;

    if (isRemoteSort) {
      const nextDirection =
        activeSortKey === nextSortKey && activeSortDirection === "asc"
          ? "desc"
          : "asc";

      onSortChange(nextSortKey, nextDirection);
      return;
    }

    if (activeSortKey === nextSortKey) {
      setLocalSortDirection(activeSortDirection === "asc" ? "desc" : "asc");
    } else {
      setLocalSortKey(nextSortKey);
      setLocalSortDirection("asc");
    }
  };

  const exportCSV = () => {
    const arr = Array.isArray(serverSide ? paginatedData : data)
      ? serverSide
        ? paginatedData
        : data
      : [];
    const headers = columns.map((c) => c.label).join(",");

    const rows = arr.map((row) =>
      columns.map((c) => row[c.key] ?? "").join(","),
    );

    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "table-data.csv";
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={serverSide ? searchValue : search}
            onChange={(e) => {
              if (serverSide) {
                onSearchChange?.(e.target.value);
                return;
              }

              setSearch(e.target.value);
              setClientPage(1);
            }}
          />
        </div>

        <Button
          variant="outline"
          onClick={exportCSV}
          className="cursor-pointer"
        >
          <Download size={16} className="mr-2" />
          Exportar
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable === false || (serverSide && !isRemoteSort) ? (
                    <span className="font-semibold">{col.label}</span>
                  ) : (
                    <Button
                      variant="ghost"
                      className={`p-0 font-semibold cursor-pointer ${
                        activeSortKey === (col.sortKey || col.key)
                          ? "text-[#13529a]"
                          : ""
                      }`}
                      onClick={() => handleSort(col)}
                    >
                      {col.label}
                      <ArrowUpDown size={14} className="ml-1" />
                    </Button>
                  )}
                </TableHead>
              ))}

              {actions && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-10 text-gray-500"
                >
                  No hay registros
                </TableCell>
              </TableRow>
            )}

            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : (row[col.key] ?? "-")}
                  </TableCell>
                ))}

                {actions && (
                  <TableCell className="text-right">{actions(row)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {serverSide ? (
        <ServerPagination
          page={currentPage}
          pageSize={currentPageSize}
          total={total}
          totalPages={totalPages}
          itemLabel={itemLabel}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      ) : (
        <ServerPagination
          page={clientPage}
          pageSize={clientPageSize}
          total={sortedData.length}
          totalPages={clientTotalPages || 1}
          itemLabel={itemLabel}
          onPageChange={setClientPage}
          onPageSizeChange={(nextPageSize) => {
            setClientPageSize(nextPageSize);
            setClientPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  );
};

export default DataTable;
