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

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";

const DataTable = ({ data = [], columns = [], actions }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Ordenamiento por defecto: id ascendente
  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // 🔎 Búsqueda
  const filteredData = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    if (!search) return arr;

    return arr.filter((row) =>
      Object.values(row)
        .map((v) => String(v))
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [data, search]);

  // ↕ Ordenamiento
  const sortedData = useMemo(() => {
    const arr = [...filteredData];

    if (!sortKey) return arr;

    return arr.sort((a, b) => {
      const A = a[sortKey];
      const B = b[sortKey];

      if (A === undefined || A === null) return 1;
      if (B === undefined || B === null) return -1;

      if (A < B) return sortDirection === "asc" ? -1 : 1;
      if (A > B) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 📄 Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const paginatedData = sortedData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Exportar CSV
  const exportCSV = () => {
    const arr = Array.isArray(data) ? data : [];
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
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
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

      {/* Tabla */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <Button
                    variant="ghost"
                    className="p-0 font-semibold cursor-pointer"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown size={14} className="ml-1" />
                  </Button>
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

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Tamaño de página */}
        <div className="flex items-center gap-2 text-sm">
          Mostrar
          <select
            className="border rounded px-2 py-1"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          registros
        </div>

        {/* Paginación */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages || 1}
          </p>

          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
