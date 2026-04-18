import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useState, useEffect } from "react";
import productCustomerService from "@/services/product_customer.service";
import productsService from "@/services/products.service";
import thirdsService from "@/services/thirds.service";

//VIEWS
import ProductCustomerForm from "./ProductCustomerForm";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const ProductCustomers = () => {
  const { user: currentUser } = useAuthStore();
  const [productCustomers, setProductCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [thirds, setThirds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    productCustomerId: null,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    productCustomerId: null,
    productCustomerName: "",
    loading: false,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  // ───────────── CARGAR DATOS ─────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pcRes, productsRes, thirdsRes] = await Promise.all([
        productCustomerService.getAll(),
        productsService.getAll(),
        thirdsService.getAll(),
      ]);
      setProductCustomers(pcRes?.data || []);
      setProducts(productsRes?.data?.products || productsRes?.data || []);
      setThirds(thirdsRes?.data?.thirds || thirdsRes?.data || []);
    } catch {
      toast.error("Error al cargar los productos de clientes");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, productCustomerId: null });
  const handleOpenEdit = (id) =>
    setFormModal({ isOpen: true, productCustomerId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, productCustomerId: null });

  const handleFormSuccess = (saved) => {
    if (formModal.productCustomerId) {
      setProductCustomers((prev) =>
        prev.map((pc) =>
          pc.id === formModal.productCustomerId ? { ...pc, ...saved } : pc,
        ),
      );
    } else {
      fetchAll();
    }
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (pc) => {
    setConfirmDialog({
      isOpen: true,
      productCustomerId: pc.id,
      productCustomerName: pc.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      productCustomerId: null,
      productCustomerName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await productCustomerService.delete(
        confirmDialog.productCustomerId,
      );
      await fetchAll();
      toast.success(
        response?.message || "Producto de cliente desactivado exitosamente",
      );
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "No se pudo desactivar el producto de cliente",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    {
      key: "product_id",
      label: "Producto",
      render: (row) =>
        products.find((p) => p.id === row.product_id)?.name ?? "-",
    },
    {
      key: "third_id",
      label: "Cliente",
      render: (row) => thirds.find((t) => t.id === row.third_id)?.name ?? "-",
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
        <Button
          size="icon"
          variant="ghost"
          disabled={!canDelete}
          onClick={() => canDelete && handleDeleteClick(row)}
          className={
            canDelete
              ? "text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
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
          <h1 className="text-2xl font-bold text-[#13529a]">
            Productos de Clientes
          </h1>
          <p className="text-sm text-gray-500">
            {productCustomers.length} productos registrados
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Producto
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
            data={productCustomers}
            columns={columns}
            actions={actions}
          />
        )}
      </div>

      <ProductCustomerForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        productCustomerId={formModal.productCustomerId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar producto de cliente?"
        description={`Estás a punto de eliminar "${confirmDialog.productCustomerName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ProductCustomers;
