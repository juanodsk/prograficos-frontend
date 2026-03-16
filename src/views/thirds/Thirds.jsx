import { useState, useEffect } from "react";
import { toast } from "sonner";

import thirdService from "../../services/thirds.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/data-table/DataTable";

import ThirdForm from "../thirds/ThirdForm";
import ThirdView from "./ThirdView";

import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, ScanEye } from "lucide-react";

const Thirds = () => {
  const [thirds, setThirds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal ver
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    thirdId: null,
  });

  // Modal crear / editar
  const [formModal, setFormModal] = useState({
    isOpen: false,
    thirdId: null,
  });

  // Confirmación eliminar
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    loading: false,
    thirdId: null,
    thirdName: "",
  });

  useEffect(() => {
    fetchThirds();
  }, []);

  const fetchThirds = async () => {
    try {
      setLoading(true);

      const response = await thirdService.getAll();

      setThirds(response?.data?.thirds || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los terceros");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────

  const handleOpenCreate = () => setFormModal({ isOpen: true, thirdId: null });

  const handleOpenEdit = (id) => setFormModal({ isOpen: true, thirdId: id });

  const handleCloseForm = () => setFormModal({ isOpen: false, thirdId: null });

  const handleView = (id) => setViewModal({ isOpen: true, thirdId: id });

  const handleCloseView = () => setViewModal({ isOpen: false, thirdId: null });

  const handleFormSuccess = (savedThird) => {
    if (formModal.thirdId) {
      setThirds((prev) =>
        prev.map((t) =>
          t.id === formModal.thirdId ? { ...t, ...savedThird } : t,
        ),
      );
    } else {
      fetchThirds();
    }
  };

  // ───────────── ELIMINAR ─────────────

  const handleDeleteClick = (third) => {
    setConfirmDialog({
      isOpen: true,
      loading: false,
      thirdId: third.id,
      thirdName: third.name,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;

    setConfirmDialog({
      isOpen: false,
      loading: false,
      thirdId: null,
      thirdName: "",
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmDialog((prev) => ({
        ...prev,
        loading: true,
      }));

      await thirdService.remove(confirmDialog.thirdId);

      toast.success("Tercero eliminado");

      setThirds((prev) => prev.filter((t) => t.id !== confirmDialog.thirdId));

      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error al eliminar el tercero",
      );

      setConfirmDialog((prev) => ({
        ...prev,
        loading: false,
      }));
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
      key: "email",
      label: "Email",
    },
    {
      key: "address",
      label: "Dirección",
    },
    {
      key: "type_person",
      label: "Tipo",
    },
    {
      key: "company_name",
      label: "Empresa",
      render: (row) => row.company_name || "-",
    },
  ];

  // ───────────── ACCIONES ─────────────

  const actions = (row) => (
    <div className="flex justify-end gap-2">
      {/* Ver */}
      <Button
        size="icon"
        variant="ghost"
        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
        onClick={() => handleView(row.id)}
        title="Ver tercero"
      >
        <ScanEye size={16} />
      </Button>

      {/* Editar */}
      <Button
        size="icon"
        variant="ghost"
        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
        onClick={() => handleOpenEdit(row.id)}
        title="Editar tercero"
      >
        <Pencil size={16} />
      </Button>

      {/* Eliminar */}
      <Button
        size="icon"
        variant="ghost"
        className="hover:text-red-600 hover:bg-red-50 cursor-pointer"
        onClick={() => handleDeleteClick(row)}
        title="Eliminar tercero"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  // ───────────── UI ─────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Terceros</h1>

          <p className="text-sm text-gray-500">
            {thirds.length} terceros registrados
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo tercero
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable data={thirds} columns={columns} actions={actions} />
        )}
      </div>

      {/* Modal formulario */}
      <ThirdForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        thirdId={formModal.thirdId}
      />

      {/* Modal ver */}
      <ThirdView
        isOpen={viewModal.isOpen}
        onClose={handleCloseView}
        thirdId={viewModal.thirdId}
      />

      {/* Confirmación eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar tercero?"
        description={`Estás a punto de eliminar a "${confirmDialog.thirdName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Thirds;
