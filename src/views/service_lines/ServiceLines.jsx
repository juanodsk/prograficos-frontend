import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { hasPermission } from "@/lib/permissions";
import serviceLinesService from "@/services/service_lines.service";
import ServiceLineForm from "./ServiceLineForm";
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const ServiceLines = () => {
  const { user: currentUser } = useAuthStore();
  const canManage = hasPermission(currentUser, "catalogs:manage");
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({
    isOpen: false,
    serviceLineId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    serviceLineId: null,
    name: "",
    loading: false,
  });

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      setLoading(true);
      const response = await serviceLinesService.getAll();
      setLines(response?.data || []);
    } catch {
      toast.error("Error al cargar las líneas de servicio");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, serviceLineId: null });
  const handleOpenEdit = (id) =>
    setFormModal({ isOpen: true, serviceLineId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, serviceLineId: null });

  const handleDeleteClick = (line) =>
    setConfirmDialog({
      isOpen: true,
      serviceLineId: line.id,
      name: line.name,
      loading: false,
    });

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      serviceLineId: null,
      name: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await serviceLinesService.delete(
        confirmDialog.serviceLineId,
      );
      await fetchLines();
      toast.success(response?.message || "Línea de servicio eliminada");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "No se pudo eliminar la línea de servicio",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    {
      key: "description",
      label: "Descripción",
      render: (row) =>
        row.description ? (
          row.description
        ) : (
          <span className="italic text-gray-400">Sin descripción</span>
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

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="icon"
        variant="ghost"
        disabled={!canManage}
        onClick={() => canManage && handleOpenEdit(row.id)}
        className={
          canManage
            ? "cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
            : "cursor-not-allowed text-gray-300 opacity-50"
        }
      >
        <Pencil size={16} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={!canManage}
        onClick={() => canManage && handleDeleteClick(row)}
        className={
          canManage
            ? "cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
            : "cursor-not-allowed text-gray-300 opacity-50"
        }
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">
            Líneas de servicio
          </h1>
          <p className="text-sm text-gray-500">
            {lines.length} líneas registradas
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
          >
            <Plus size={16} className="mr-2" />
            Nueva Línea
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Layers size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                No hay líneas de servicio registradas
              </p>
              <p className="text-sm text-gray-500">
                Crea la primera línea (ej. Offset) para empezar.
              </p>
            </div>
          </div>
        ) : (
          <DataTable
            data={lines}
            columns={columns}
            actions={actions}
            storageKey="config-service-lines"
          />
        )}
      </div>

      <ServiceLineForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={fetchLines}
        serviceLineId={formModal.serviceLineId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar línea de servicio?"
        description={`Estás a punto de eliminar la línea "${confirmDialog.name}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ServiceLines;
