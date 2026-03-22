import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import formatsService from "../../services/formats.service";
const Formats = () => {
  const { user: currentUser } = useAuthStore();
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    formatId: null,
  });
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
  const handleView = (id) => setViewModal({ isOpen: true, formatId: id });
  const handleCloseView = () => setViewModal({ isOpen: false, formatId: null });

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
      await formatsService.delete(confirmDialog.formatId);
      setFormats((prev) => prev.filter((f) => f.id !== confirmDialog.formatId));
      toast.success("Formato eliminado correctamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo eliminar el formato",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };
  return <div>Formats</div>;
};

export default Formats;
