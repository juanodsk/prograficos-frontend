import { useState, useEffect } from "react";
import { toast } from "sonner";
import thirdService from "../../services/thirds.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ThirdForm from "../thirds/ThirdForm";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Loader2, Search, Plus, Pencil, Trash2, ScanEye } from "lucide-react";
import ThirdView from "./ThirdView";

const Thirds = () => {
  const [thirds, setThirds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal de vista de información
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    thirdId: null,
  });
  // Modal crear/editar
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

  const filtered = thirds.filter((t) =>
    `${t.name} ${t.email} ${t.company_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  // ── Crear / Editar ─────────────────────────
  const handleOpenCreate = () => setFormModal({ isOpen: true, thirdId: null });

  const handleOpenEdit = (id) => setFormModal({ isOpen: true, thirdId: id });

  const handleCloseForm = () => setFormModal({ isOpen: false, thirdId: null });
  const handleView = (id) => setViewModal({ isOpen: true, thirdId: id });

  const handleCloseView = () => setViewModal({ isOpen: false, thirdId: null });

  const handleFormSuccess = (savedThird) => {
    if (formModal.thirdId) {
      // edición
      setThirds((prev) =>
        prev.map((t) =>
          t.id === formModal.thirdId ? { ...t, ...savedThird } : t,
        ),
      );
    } else {
      // creación
      fetchThirds();
    }
  };

  // ── Confirm dialog eliminar ─────────────────────────
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
      setConfirmDialog((prev) => ({ ...prev, loading: true }));

      await thirdService.remove(confirmDialog.thirdId);

      toast.success("Tercero eliminado");

      setThirds((prev) => prev.filter((t) => t.id !== confirmDialog.thirdId));

      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error al eliminar el tercero",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ── UI ─────────────────────────
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

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Buscador */}
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              placeholder="Buscar terceros..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No se encontraron terceros
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#13529a]/5">
                <TableHead className="text-[#13529a] font-semibold">
                  ID
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Nombre
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Email
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Dirección
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Tipo
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Empresa
                </TableHead>
                <TableHead className="text-right text-[#13529a] font-semibold">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className="hover:bg-[#13529a]/5 transition-colors"
                >
                  <TableCell className="font-medium">{t.id}</TableCell>

                  <TableCell className="font-medium">{t.name}</TableCell>

                  <TableCell className="text-gray-600">{t.email}</TableCell>

                  <TableCell className="text-gray-600">{t.address}</TableCell>

                  <TableCell className="text-gray-600">
                    {t.type_person}
                  </TableCell>

                  <TableCell className="text-gray-600">
                    {t.company_name || "-"}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Ver */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
                        title="Ver tercero"
                        onClick={() => handleView(t.id)}
                      >
                        <ScanEye size={16} />
                      </Button>

                      {/* Editar */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(t.id)}
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
                        title="Editar tercero"
                      >
                        <Pencil size={16} />
                      </Button>

                      {/* Eliminar */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(t)}
                        className="hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Eliminar tercero"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal formulario */}
      <ThirdForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        thirdId={formModal.thirdId}
      />
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
