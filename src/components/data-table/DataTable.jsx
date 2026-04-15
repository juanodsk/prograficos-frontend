import { useState, useMemo } from "react";

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
  const [search, setSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(10);

  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

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

    if (serverSide || !sortKey) return arr;

    return arr.sort((a, b) => {
      const A = a[sortKey];
      const B = b[sortKey];

      if (A === undefined || A === null) return 1;
      if (B === undefined || B === null) return -1;

      if (A < B) return sortDirection === "asc" ? -1 : 1;
      if (A > B) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [filteredData, sortKey, sortDirection, serverSide]);

  const clientTotalPages = Math.ceil(sortedData.length / clientPageSize);

  const paginatedData = serverSide
    ? sortedData
    : sortedData.slice(
        (clientPage - 1) * clientPageSize,
        clientPage * clientPageSize,
      );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
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
                  {serverSide ? (
                    <span className="font-semibold">{col.label}</span>
                  ) : (
                    <Button
                      variant="ghost"
                      className="p-0 font-semibold cursor-pointer"
                      onClick={() => handleSort(col.key)}
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
