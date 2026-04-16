import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import measuresService from "../../services/measures.service";
import formatsService from "@/services/formats.service";

//VIEWS
import MeasuresForm from "./MeasuresForm";
import MeasuresView from "./MeasuresView";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye } from "lucide-react";

const Measures = () => {
  const { user: currentUser } = useAuthStore();
  const [measures, setMeasures] = useState([]);
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    measureId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    measureId: null,
    measureName: "",
    loading: false,
  });

  useEffect(() => {
    fetchMeasures();
  }, []);

  // ───────────── CARGAR MEDIDAS Y FORMATOS ─────────────
  const fetchMeasures = async () => {
    try {
      setLoading(true);
      const [measuresRes, formatsRes] = await Promise.all([
        measuresService.getAll(),
        formatsService.getAll(),
      ]);
      setMeasures(measuresRes?.data || []);
      setFormats(formatsRes?.data || formatsRes || []);
    } catch {
      toast.error("Error al cargar las medidas");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, measureId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, measureId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, measureId: null });

  const handleFormSuccess = (savedFormat) => {
    if (formModal.measureId) {
      setMeasures((prev) =>
        prev.map((m) =>
          m.id === formModal.measureId ? { ...m, ...savedFormat } : m,
        ),
      );
    } else {
      fetchMeasures();
    }
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (measure) => {
    setConfirmDialog({
      isOpen: true,
      measureId: measure.id,
      measureName: `${measure.width} x ${measure.height}`,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      measureId: null,
      measureName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await measuresService.delete(confirmDialog.measureId);
      await fetchMeasures();
      toast.success(response?.message || "Medida desactivada exitosamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo desactivar la medida",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "width", label: "Ancho" },
    { key: "height", label: "Alto" },
    {
      key: "format_id",
      label: "Formato",
      render: (row) => {
        const format = formats.find((f) => f.id === row.format_id);
        return format?.name ?? "-";
      },
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
          <h1 className="text-2xl font-bold text-[#13529a]">Medidas</h1>
          <p className="text-sm text-gray-500">
            {measures.length} Medidas registradas
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nueva Medida
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
            data={measures}
            columns={columns}
            actions={actions}
            storageKey="config-measures"
          />
        )}
      </div>

      <MeasuresForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        measureId={formModal.measureId}
        formatId={formModal.formatId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar medida?"
        description={`Estás a punto de eliminar la medida "${confirmDialog.measureName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Measures;
