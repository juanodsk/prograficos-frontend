import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import machineryService from "@/services/machinery.service";
import { getMachineryTypeLabel } from "@/constants/machineryTypes";
import MachineryForm from "./MachineryForm";
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Factory, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const Machinery = () => {
  const { user: currentUser } = useAuthStore();
  const [machinery, setMachinery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({
    isOpen: false,
    machineryId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    machineryId: null,
    machineryName: "",
    loading: false,
  });

  useEffect(() => {
    fetchMachinery();
  }, []);

  const fetchMachinery = async () => {
    try {
      setLoading(true);
      const response = await machineryService.getAll();
      setMachinery(response?.data || []);
    } catch {
      toast.error("Error al cargar las maquinarias");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, machineryId: null });

  const handleOpenEdit = (id) =>
    setFormModal({ isOpen: true, machineryId: id });

  const handleCloseForm = () =>
    setFormModal({ isOpen: false, machineryId: null });

  const handleFormSuccess = () => {
    fetchMachinery();
  };

  const handleDeleteClick = (machine) => {
    setConfirmDialog({
      isOpen: true,
      machineryId: machine.id,
      machineryName: machine.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;

    setConfirmDialog({
      isOpen: false,
      machineryId: null,
      machineryName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));

    try {
      const response = await machineryService.delete(confirmDialog.machineryId);
      await fetchMachinery();
      toast.success(response?.message || "Maquinaria desactivada exitosamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo desactivar la maquinaria",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    { key: "reference", label: "Código" },
    {
      key: "type",
      label: "Tipo",
      render: (row) => getMachineryTypeLabel(row.type),
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
          {row.is_active ? "Activa" : "Inactiva"}
        </span>
      ),
    },
  ];

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
              ? "cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
              : "cursor-not-allowed text-gray-300 opacity-50"
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
              ? "cursor-pointer hover:bg-red-50 hover:text-red-600"
              : "cursor-not-allowed text-gray-300 opacity-50"
          }
        >
          <Trash2 size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Maquinarias</h1>
          <p className="text-sm text-gray-500">
            {machinery.length} máquinas registradas
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
        >
          <Plus size={16} className="mr-2" />
          Nueva Maquinaria
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : machinery.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Factory size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                No hay maquinarias registradas
              </p>
              <p className="text-sm text-gray-500">
                Crea la primera máquina para empezar a usarla en producción.
              </p>
            </div>
          </div>
        ) : (
          <DataTable data={machinery} columns={columns} actions={actions} />
        )}
      </div>

      <MachineryForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        machineryId={formModal.machineryId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar maquinaria?"
        description={`Estás a punto de eliminar la máquina "${confirmDialog.machineryName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Machinery;
