import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import processesService from "@/services/processes.service";

//VIEWS
import ProcessesForm from "./ProcessesForm";
// import MeasuresView from "./MeasuresView";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const Processes = () => {
  const { user: currentUser } = useAuthStore();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    processId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    processId: null,
    processName: "",
    loading: false,
  });

  useEffect(() => {
    fetchProcesses();
  }, []);

  // ───────────── CARGAR PROCESOS ─────────────
  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const [processesRes] = await Promise.all([processesService.getAll()]);
      setProcesses(processesRes?.data || []);
    } catch {
      toast.error("Error al cargar los procesos");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, processId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, processId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, processId: null });

  const handleFormSuccess = () => {
    fetchProcesses();
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (process) => {
    setConfirmDialog({
      isOpen: true,
      processId: process.id,
      processName: process.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      processId: null,
      processName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await processesService.delete(confirmDialog.processId);
      await fetchProcesses();
      toast.success(response?.message || "Proceso desactivado exitosamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo desactivar el proceso",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "category", label: "Categoria" },
    { key: "order", label: "Orden" },
    {
      key: "field_definitions",
      label: "Campos",
      render: (row) => row.field_definitions?.length || 0,
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
          <h1 className="text-2xl font-bold text-[#13529a]">Procesos</h1>
          <p className="text-sm text-gray-500">
            {processes.length} Procesos registrados
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Proceso
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
            data={processes}
            columns={columns}
            actions={actions}
            storageKey="config-processes"
          />
        )}
      </div>

      <ProcessesForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        processId={formModal.processId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar proceso?"
        description={`Estás a punto de eliminar el proceso "${confirmDialog.processName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Processes;
