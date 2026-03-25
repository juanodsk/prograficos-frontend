import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import paperTypesService from "@/services/paper_types.service";

//VIEWS
import PaperTypesForm from "./PaperTypesForm";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye } from "lucide-react";

const PaperTypes = () => {
  const { user: currentUser } = useAuthStore();
  const [paperTypes, setPaperTypes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchPaperTypes();
  }, []);

  // ───────────── CARGAR TIPOS DE PAPEL ─────────────
  const fetchPaperTypes = async () => {
    try {
      setLoading(true);
      const [paperTypesRes] = await Promise.all([paperTypesService.getAll()]);
      setPaperTypes(paperTypesRes?.data || []);
      console.log(paperTypesRes);
    } catch {
      toast.error("Error al cargar los tipos de papel");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, paperTypeId: null });
  const handleOpenEdit = (id) =>
    setFormModal({ isOpen: true, paperTypeId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, paperTypeId: null });

  const handleFormSuccess = (savedFormat) => {
    if (formModal.paperTypeId) {
      setPaperTypes((prev) =>
        prev.map((pt) =>
          pt.id === formModal.paperTypeId ? { ...pt, ...savedFormat } : pt,
        ),
      );
    } else {
      fetchPaperTypes();
    }
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
      setPaperTypes((prev) =>
        prev.filter((pt) => pt.id !== confirmDialog.paperTypeId),
      );
      toast.success(
        response?.message || "Tipo de papel eliminado exitosamente",
      );
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.message || "No se pudo eliminar el tipo de papel",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "grammage", label: "Gramaje" },

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
            {paperTypes.length} Tipos de papel registrados
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
          <DataTable data={paperTypes} columns={columns} actions={actions} />
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
