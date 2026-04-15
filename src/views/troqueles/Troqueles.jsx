import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import TroquelForm from "../troqueles/TroquelForm";
import TroquelView from "./TroquelView";
import DataTable from "../../components/data-table/DataTable";
import { useAuthStore } from "../../store/authStore";

import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye, Download } from "lucide-react";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const Troqueles = () => {
  const { user: currentUser } = useAuthStore();

  const [troqueles, setTroqueles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultMeta.pageSize);
  const [meta, setMeta] = useState(defaultMeta);

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    troquelId: null,
  });
  const [formModal, setFormModal] = useState({
    isOpen: false,
    troquelId: null,
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
      });
      const troquelesArray = response?.data || [];
      setTroqueles(troquelesArray);
      setMeta(response?.meta || defaultMeta);

      if (response?.meta?.page && response.meta.page !== page) {
        setPage(response.meta.page);
      }
    } catch {
      toast.error("Error al cargar los troqueles");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

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
      troquelName: troquel.name || troquel.file_name,
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

  // ───────────── DESCARGAR ARCHIVO ─────────────
  const handleDownload = async (troquel) => {
    if (!troquel.file) return;
    try {
      const link = document.createElement("a");
      link.href = `data:application/octet-stream;base64,${troquel.file}`;
      link.download = troquel.file_name || "archivo.troquel";
      link.click();
    } catch {
      toast.error("Error al descargar el archivo");
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "code", label: "Código" },
    { key: "size", label: "Tamaño" },
    {
      key: "elaboration_date",
      label: "Fecha de Elaboración",
      render: (row) =>
        row.elaboration_date
          ? new Date(row.elaboration_date).toLocaleDateString()
          : "N/A",
    },
    {
      key: "file",
      label: "Archivo",
      render: (row) =>
        row.file ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row)}
            className="cursor-pointer"
          >
            <Download size={14} className="mr-1 " /> {row.file_name}
          </Button>
        ) : (
          <span className="text-gray-400">Sin archivo</span>
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
              ? "hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
        {loading ? (
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
              setSearch(value);
              setPage(1);
            }}
            currentPage={meta.page}
            currentPageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
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

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar troquel?"
        description={`Estás a punto de eliminar "${confirmDialog.troquelName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Troqueles;
