import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import TroquelForm from "../troqueles/TroquelForm";
import TroquelImagesViewer from "./TroquelImagesViewer";
import TroquelView from "./TroquelView";
import DataTable from "../../components/data-table/DataTable";
import { useAuthStore } from "../../store/authStore";
import usePersistedTableState from "../../hooks/usePersistedTableState";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTroquelCode } from "@/lib/troquel";
import { Plus, Pencil, Trash2, Loader2, ScanEye, Images } from "lucide-react";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const defaultTableState = {
  search: "",
  size: "",
  page: 1,
  pageSize: defaultMeta.pageSize,
  sortKey: "elaboration_date",
  sortDirection: "desc",
};

// Filtro por tamaño con "dot" de color (como las pestañas del Excel viejo).
const SIZE_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos los tamaños", dot: "bg-slate-300" },
  { value: "SMALL", label: "Pequeño", dot: "bg-blue-500" },
  { value: "MEDIUM", label: "Mediano", dot: "bg-red-500" },
  { value: "LARGE", label: "Grande", dot: "bg-green-500" },
  { value: "EXTERNAL", label: "Externo", dot: "bg-purple-500" },
];

const sizeConfig = {
  SMALL: {
    label: "S",
    className: "bg-blue-100 text-blue-800",
  },
  MEDIUM: {
    label: "M",
    className: "bg-red-100 text-red-800",
  },
  LARGE: {
    label: "L",
    className: "bg-green-100 text-green-800",
  },
  EXTERNAL: {
    label: "E",
    className: "bg-purple-100 text-purple-800",
  },
};

const Troqueles = () => {
  const { user: currentUser } = useAuthStore();

  const [troqueles, setTroqueles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableState, setTableState] = usePersistedTableState(
    "config-troqueles",
    defaultTableState,
  );
  const {
    search,
    size: sizeFilter,
    page,
    pageSize,
    sortKey,
    sortDirection,
  } = tableState;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState(defaultMeta);

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    troquelId: null,
  });
  const [formModal, setFormModal] = useState({
    isOpen: false,
    troquelId: null,
  });
  const [imagesViewer, setImagesViewer] = useState({
    open: false,
    troquelId: null,
    code: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    troquelId: null,
    troquelName: "",
    loading: false,
  });

  // ───────────── CARGAR TROQUELES ─────────────
  const fetchTroqueles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await troquelesService.getAll({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        size: sizeFilter || undefined,
        sortBy: sortKey,
        sortDirection,
      });
      const troquelesArray = response?.data || [];
      setTroqueles(troquelesArray);
      setMeta(response?.meta || defaultMeta);

      if (response?.meta?.page && response.meta.page !== page) {
        setTableState((prev) => ({ ...prev, page: response.meta.page }));
      }
    } catch {
      toast.error("Error al cargar los troqueles");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sizeFilter, page, pageSize, sortDirection, sortKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchTroqueles();
  }, [fetchTroqueles]);

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, troquelId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, troquelId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, troquelId: null });
  const handleView = (id) => setViewModal({ isOpen: true, troquelId: id });
  const handleCloseView = () =>
    setViewModal({ isOpen: false, troquelId: null });

  const handleFormSuccess = () => {
    fetchTroqueles();
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (troquel) => {
    setConfirmDialog({
      isOpen: true,
      troquelId: troquel.id,
      troquelName: troquel.name || formatTroquelCode(troquel),
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      troquelId: null,
      troquelName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await troquelesService.delete(confirmDialog.troquelId);
      await fetchTroqueles();
      toast.success(response?.message || "Troquel desactivado correctamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo desactivar el troquel",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── VER IMÁGENES (R2) ─────────────
  const handleViewImages = (troquel) => {
    setImagesViewer({
      open: true,
      troquelId: troquel.id,
      code: formatTroquelCode(troquel) || "Troquel",
    });
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    {
      key: "code",
      label: "Código",
      render: (row) => {
        const config = sizeConfig[row.size] || {
          label: "",
          className: "bg-gray-100 text-gray-800",
        };

        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${config.className}`}
          >
            {formatTroquelCode(row) || "Sin código"}
          </span>
        );
      },
    },

    {
      key: "elaboration_date",
      label: "Fecha de Elaboración",
      render: (row) =>
        row.elaboration_date
          ? new Date(row.elaboration_date).toLocaleDateString()
          : "N/A",
    },
    {
      key: "images",
      label: "Imágenes",
      render: (row) =>
        row.total_images > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewImages(row)}
            className="cursor-pointer"
          >
            <Images size={14} className="mr-1" /> Ver
          </Button>
        ) : (
          <span className="italic text-gray-700">Sin imagen</span>
        ),
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            row.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  // ───────────── ACCIONES ─────────────
  const actions = (row) => {
    const canEdit = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);
    const canDelete = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);

    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          disabled={!canEdit}
          onClick={() => canEdit && handleOpenEdit(row.id)}
          className={
            canEdit
              ? "hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-50"
          }
        >
          <Pencil size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={!canDelete}
          onClick={() => canDelete && handleDeleteClick(row)}
          className={
            canDelete
              ? "text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-50"
          }
        >
          <Trash2 size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Troqueles</h1>
          <p className="text-sm text-gray-500">
            {meta.total} Troqueles registrados
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" /> Nuevo Troquel
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {/* Spinner solo en la carga inicial; en los refetch (buscar/filtrar) se
            mantiene el DataTable montado para no perder el foco del buscador. */}
        {loading && troqueles.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable
            data={troqueles}
            columns={columns}
            actions={actions}
            serverSide
            searchValue={search}
            onSearchChange={(value) => {
              setTableState((prev) => ({ ...prev, search: value, page: 1 }));
            }}
            toolbarExtra={
              <Select
                value={sizeFilter || "ALL"}
                onValueChange={(value) =>
                  setTableState((prev) => ({
                    ...prev,
                    size: value === "ALL" ? "" : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-[190px] cursor-pointer text-sm">
                  <SelectValue placeholder="Filtrar por tamaño">
                    {(() => {
                      const opt = SIZE_FILTER_OPTIONS.find(
                        (o) => o.value === (sizeFilter || "ALL"),
                      );
                      return opt ? (
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${opt.dot}`}
                          />
                          {opt.label}
                        </span>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SIZE_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${option.dot}`}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            currentPage={meta.page}
            currentPageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) =>
              setTableState((prev) => ({ ...prev, page: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTableState((prev) => ({
                ...prev,
                pageSize: nextPageSize,
                page: 1,
              }));
            }}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(nextSortKey, nextSortDirection) => {
              setTableState((prev) => ({
                ...prev,
                sortKey: nextSortKey,
                sortDirection: nextSortDirection,
                page: 1,
              }));
            }}
            itemLabel="troqueles"
          />
        )}
      </div>

      {/* Modal formulario */}
      <TroquelForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        troquelId={formModal.troquelId}
      />

      <TroquelImagesViewer
        open={imagesViewer.open}
        troquelId={imagesViewer.troquelId}
        title={`Imágenes · ${imagesViewer.code}`}
        onClose={() =>
          setImagesViewer({ open: false, troquelId: null, code: "" })
        }
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar troquel?"
        description={`Vas a eliminar "${confirmDialog.troquelName}". Si tiene productos asociados, se conservará su historial y dejará de mostrarse; si no tiene ninguno, se eliminará de forma permanente. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Troqueles;
