import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import formatsService from "../../services/formats.service";

//VIEWS
import FormatForm from "./FormatsForm";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye } from "lucide-react";

const Formats = () => {
  const { user: currentUser } = useAuthStore();
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    formatId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    formatId: null,
    formatName: "",
    loading: false,
  });
  useEffect(() => {
    fetchFormats();
  }, []);

  // ───────────── CARGAR FORMATOS ─────────────
  const fetchFormats = async () => {
    try {
      setLoading(true);
      const response = await formatsService.getAll();
      const formatsArray = response?.data || [];
      setFormats(formatsArray);
      console.log(formatsArray);
    } catch {
      toast.error("Error al cargar los formatos");
    } finally {
      setLoading(false);
    }
  };
  // ───────────── MODALES ─────────────
  const handleOpenCreate = () => setFormModal({ isOpen: true, formatId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, formatId: id });
  const handleCloseForm = () => setFormModal({ isOpen: false, formatId: null });

  const handleFormSuccess = (savedFormat) => {
    if (formModal.formatId) {
      setFormats((prev) =>
        prev.map((f) =>
          f.id === formModal.formatId ? { ...f, ...savedFormat } : f,
        ),
      );
    } else {
      fetchFormats();
    }
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (format) => {
    setConfirmDialog({
      isOpen: true,
      formatId: format.id,
      formatName: format.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      formatId: null,
      formatName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await formatsService.delete(confirmDialog.formatId);
      await fetchFormats();
      toast.success(response?.message || "Formato desactivado exitosamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo desactivar el formato",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };
  // ───────────── COLUMNAS ─────────────
  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "sheet_divisions",
      label: "Divisiones",
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
          <h1 className="text-2xl font-bold text-[#13529a]">Formatos</h1>
          <p className="text-sm text-gray-500">
            {formats.length} Formatos registrados
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Formato
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
            data={formats}
            columns={columns}
            actions={actions}
            storageKey="config-formats"
          />
        )}
      </div>
      <FormatForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        formatId={formModal.formatId}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar formato?"
        description={`Estás a punto de eliminar a "${confirmDialog.formatName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Formats;
