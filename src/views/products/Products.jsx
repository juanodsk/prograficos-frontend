import { useState, useEffect, useCallback } from "react";
import productsService from "../../services/products.service";
import { useAuthStore } from "../../store/authStore";

//VIEWS
import ProductForm from "../products/ProductForm";
import ProductView from "./ProductView";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye } from "lucide-react";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const Products = () => {
  const { user: currentUser } = useAuthStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultMeta.pageSize);
  const [meta, setMeta] = useState(defaultMeta);

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    productId: null,
  });

  const [formModal, setFormModal] = useState({
    isOpen: false,
    productId: null,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    productId: null,
    productName: "",
    loading: false,
  });

  // ───────────── CARGAR PRODUCTOS ─────────────
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await productsService.getAll({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      });
      const productsArray = response?.data?.products || [];

      setProducts(productsArray);
      setMeta(response?.meta || defaultMeta);

      if (response?.meta?.page && response.meta.page !== page) {
        setPage(response.meta.page);
      }
    } catch {
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, productId: null });

  const handleOpenEdit = (id) => setFormModal({ isOpen: true, productId: id });

  const handleCloseForm = () =>
    setFormModal({ isOpen: false, productId: null });

  const handleView = (id) => setViewModal({ isOpen: true, productId: id });

  const handleCloseView = () =>
    setViewModal({ isOpen: false, productId: null });

  const handleFormSuccess = () => {
    fetchProducts();
  };

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (product) => {
    setConfirmDialog({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      productId: null,
      productName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));

    try {
      const response = await productsService.delete(confirmDialog.productId);
      await fetchProducts();
      toast.success(response?.message || "Producto desactivado correctamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo desactivar el producto",
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
        {/* Ver */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleView(row.id)}
          className="hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
        >
          <ScanEye size={16} />
        </Button>

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

  // ───────────── UI ─────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Productos</h1>
          <p className="text-sm text-gray-500">
            {meta.total} Productos registrados
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
            data={products}
            columns={columns}
            actions={actions}
            serverSide
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            currentPage={meta.page}
            currentPageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            itemLabel="productos"
          />
        )}
      </div>

      {/* Modal formulario */}
      <ProductForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        productId={formModal.productId}
      />

      {/* Modal ver */}
      <ProductView
        isOpen={viewModal.isOpen}
        onClose={handleCloseView}
        productId={viewModal.productId}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar producto?"
        description={`Estás a punto de eliminar a "${confirmDialog.productName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Products;
