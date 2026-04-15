import { useAuthStore } from "../../store/authStore";
import { useState, useEffect, useCallback } from "react";
import paperTypesService from "@/services/paper_types.service";

//VIEWS
import PaperTypesForm from "./PaperTypesForm";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const PaperTypes = () => {
  const { user: currentUser } = useAuthStore();
  const [paperTypes, setPaperTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultMeta.pageSize);
  const [meta, setMeta] = useState(defaultMeta);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    paperTypeId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    paperTypeId: null,
    measureName: "",
    loading: false,
  });

  // ───────────── CARGAR TIPOS DE PAPEL ─────────────
  const fetchPaperTypes = useCallback(async () => {
    try {
      setLoading(true);
      const [paperTypesRes] = await Promise.all([
        paperTypesService.getAll({
          page,
          pageSize,
          search: debouncedSearch || undefined,
        }),
      ]);
      setPaperTypes(paperTypesRes?.data || []);
      setMeta(paperTypesRes?.meta || defaultMeta);

      if (paperTypesRes?.meta?.page && paperTypesRes.meta.page !== page) {
        setPage(paperTypesRes.meta.page);
      }
    } catch {
      toast.error("Error al cargar los tipos de papel");
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
    fetchPaperTypes();
  }, [fetchPaperTypes]);

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, paperTypeId: null });
  const handleOpenEdit = (id) =>
    setFormModal({ isOpen: true, paperTypeId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, paperTypeId: null });

  const handleFormSuccess = () => {
    fetchPaperTypes();
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (paperType) => {
    setConfirmDialog({
      isOpen: true,
      paperTypeId: paperType.id,
      paperTypeName: paperType.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      paperTypeId: null,
      paperTypeName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await paperTypesService.delete(
        confirmDialog.paperTypeId,
      );
      await fetchPaperTypes();
      toast.success(
        response?.message || "Tipo de papel desactivado exitosamente",
      );
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "No se pudo desactivar el tipo de papel",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    {
      key: "grammage",
      label: "Gramaje",
      render: (row) => `${row.grammage} gr`,
    },
    {
      key: "suppliers",
      label: "Proveedores",
      render: (row) =>
        row.suppliers?.length
          ? `${row.suppliers.length} asociado(s)`
          : "Sin proveedores",
    },

    {
      key: "is_active",
      label: "Estado",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
        {/* Editar */}
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

        {/* Eliminar */}
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
          <h1 className="text-2xl font-bold text-[#13529a]">Tipos de Papel</h1>
          <p className="text-sm text-gray-500">
            {meta.total} Tipos de papel registrados
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Tipo de Papel
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
            data={paperTypes}
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
            itemLabel="tipos de papel"
          />
        )}
      </div>

      <PaperTypesForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        paperTypeId={formModal.paperTypeId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar tipo de papel?"
        description={`Estás a punto de eliminar el tipo de papel "${confirmDialog.paperTypeName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default PaperTypes;
