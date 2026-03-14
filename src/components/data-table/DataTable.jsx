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
import { Checkbox } from "@/components/ui/checkbox";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Columns,
} from "lucide-react";

const DataTable = ({ data = [], columns = [], actions, pageSize = 10 }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((col) => col.key),
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const visibleCols = columns.filter((col) => visibleColumns.includes(col.key));

  // 🔎 búsqueda
  const filteredData = useMemo(() => {
    if (!search) return data;

    return data.filter((row) =>
      Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  // ↕ ordenamiento
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const A = a[sortKey];
      const B = b[sortKey];

      if (A < B) return sortDirection === "asc" ? -1 : 1;
      if (A > B) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 📄 paginación
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

  // seleccionar filas
  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map((r) => r.id));
    }
  };

  // exportar CSV
  const exportCSV = () => {
    const headers = visibleCols.map((c) => c.label).join(",");

    const rows = data.map((row) =>
      visibleCols.map((c) => row[c.key]).join(","),
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
      {/* toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* buscador */}
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

        {/* acciones */}
        <div className="flex gap-2">
          {/* export */}
          <Button
            variant="outline"
            onClick={exportCSV}
            className="cursor-pointer"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Button>

          {/* columnas */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-2">
            <Columns size={16} />

            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-1 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={visibleColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />

                {col.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* tabla */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={selectedRows.length === paginatedData.length}
                  onCheckedChange={toggleAllRows}
                />
              </TableHead>

              {visibleCols.map((col) => (
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
                  colSpan={columns.length + 2}
                  className="text-center py-10 text-gray-500"
                >
                  No hay registros
                </TableCell>
              </TableRow>
            )}

            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={() => toggleRow(row.id)}
                  />
                </TableCell>

                {visibleCols.map((col) => (
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

      {/* paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Página {page} de {totalPages || 1}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft size={16} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="cursor-pointer"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
