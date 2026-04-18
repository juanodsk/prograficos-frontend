import { useState, useEffect, useCallback } from "react";
import productsService from "../../services/products.service";
import { useAuthStore } from "../../store/authStore";

import ProductForm from "../products/ProductForm";
import ProductView from "./ProductView";

import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, ScanEye } from "lucide-react";
import usePersistedTableState from "../../hooks/usePersistedTableState";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const defaultTableState = {
  search: "",
  page: 1,
  pageSize: defaultMeta.pageSize,
  sortKey: "third",
  sortDirection: "asc",
};

const formatTroquelLabel = (troquel) => {
  if (!troquel) return "-";
  return troquel.code || troquel.file_name || `Troquel #${troquel.id}`;
};

const formatThirdLabel = (third) => {
  if (!third) return "-";
  return third.company_name || third.name || `Tercero #${third.id}`;
};

const formatProductDisplayName = (product) =>
  product?.name || `${formatThirdLabel(product?.third)} · ${formatTroquelLabel(product?.troquel)}`;

const Products = () => {
  const { user: currentUser } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableState, setTableState] = usePersistedTableState(
    "config-products",
    defaultTableState,
  );
  const { search, page, pageSize, sortKey, sortDirection } = tableState;
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await productsService.getAll({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortKey,
        sortDirection,
      });

      setProducts(response?.data?.products || []);
      setMeta(response?.meta || defaultMeta);

      if (response?.meta?.page && response.meta.page !== page) {
        setTableState((prev) => ({ ...prev, page: response.meta.page }));
      }
    } catch {
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, sortDirection, sortKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreate = () => setFormModal({ isOpen: true, productId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, productId: id });
  const handleCloseForm = () => setFormModal({ isOpen: false, productId: null });
  const handleView = (id) => setViewModal({ isOpen: true, productId: id });
  const handleCloseView = () => setViewModal({ isOpen: false, productId: null });
  const handleFormSuccess = () => fetchProducts();

  const handleDeleteClick = (product) => {
    setConfirmDialog({
      isOpen: true,
      productId: product.id,
      productName: formatProductDisplayName(product),
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

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "name",
      label: "Nombre",
      render: (row) => row.name || "Sin nombre",
    },
    {
      key: "third",
      label: "Tercero",
      render: (row) => formatThirdLabel(row.third),
    },
    {
      key: "troquel",
      label: "Troquel",
      render: (row) => formatTroquelLabel(row.troquel),
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

  const actions = (row) => {
    const canEdit = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);
    const canDelete = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);

    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleView(row.id)}
          className="cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
        >
          <ScanEye size={16} />
        </Button>

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
              ? "cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
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
          <h1 className="text-2xl font-bold text-[#13529a]">Productos</h1>
          <p className="text-sm text-gray-500">{meta.total} productos registrados</p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
        >
          <Plus size={16} className="mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
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
              setTableState((prev) => ({ ...prev, search: value, page: 1 }));
            }}
            currentPage={meta.page}
            currentPageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) =>
              setTableState((prev) => ({ ...prev, page: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTableState((prev) => ({
                ...prev,
                pageSize: nextPageSize,
                page: 1,
              }));
            }}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(nextSortKey, nextSortDirection) => {
              setTableState((prev) => ({
                ...prev,
                sortKey: nextSortKey,
                sortDirection: nextSortDirection,
                page: 1,
              }));
            }}
            itemLabel="productos"
          />
        )}
      </div>

      <ProductForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        productId={formModal.productId}
      />

      <ProductView
        isOpen={viewModal.isOpen}
        onClose={handleCloseView}
        productId={viewModal.productId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Desactivar producto?"
        description={`Estás a punto de desactivar "${confirmDialog.productName}". Esta acción no se puede deshacer.`}
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Products;
