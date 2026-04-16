import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import thirdService from "../../services/thirds.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/data-table/DataTable";
import usePersistedTableState from "../../hooks/usePersistedTableState";

import ThirdForm from "../thirds/ThirdForm";
import ThirdView from "./ThirdView";
import {
  THIRD_TYPE_OPTIONS,
  getDocumentTypeLabel,
  getPersonTypeLabel,
  getThirdTypeLabel,
} from "@/constants/thirds";

import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, ScanEye } from "lucide-react";

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
  sortKey: "name",
  sortDirection: "asc",
  typePerson: "ALL",
};

const thirdTypeTabs = [{ value: "ALL", label: "Todos" }, ...THIRD_TYPE_OPTIONS];

const getTabButtonClassName = (isActive) =>
  `shrink-0 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-white text-[#13529a] shadow-sm"
      : "border-transparent bg-transparent text-slate-500 hover:bg-white/60 hover:text-[#13529a]"
  }`;

const Thirds = () => {
  const [thirds, setThirds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableState, setTableState] = usePersistedTableState(
    "config-thirds",
    defaultTableState,
  );
  const { search, page, pageSize, sortKey, sortDirection, typePerson } =
    tableState;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState(defaultMeta);

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

  const fetchThirds = useCallback(async () => {
    try {
      setLoading(true);

      const response = await thirdService.getAll({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortKey,
        sortDirection,
        typePerson: typePerson !== "ALL" ? typePerson : undefined,
      });

      setThirds(response?.data?.thirds || []);
      setMeta(response?.meta || defaultMeta);

      if (response?.meta?.page && response.meta.page !== page) {
        setTableState((prev) => ({ ...prev, page: response.meta.page }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los terceros");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, sortDirection, sortKey, typePerson]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchThirds();
  }, [fetchThirds]);

  // ───────────── MODALES ─────────────

  const handleOpenCreate = () => setFormModal({ isOpen: true, thirdId: null });

  const handleOpenEdit = (id) => setFormModal({ isOpen: true, thirdId: id });

  const handleCloseForm = () => setFormModal({ isOpen: false, thirdId: null });

  const handleView = (id) => setViewModal({ isOpen: true, thirdId: id });

  const handleCloseView = () => setViewModal({ isOpen: false, thirdId: null });

  const handleFormSuccess = () => {
    fetchThirds();
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

      const response = await thirdService.delete(confirmDialog.thirdId);

      toast.success(response?.message || "Tercero desactivado exitosamente");

      await fetchThirds();

      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error al desactivar el tercero",
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
      key: "type_person",
      label: "Tipo de tercero",
      render: (row) => getThirdTypeLabel(row.type_person),
    },
    {
      key: "person_type",
      label: "Tipo de persona",
      render: (row) => getPersonTypeLabel(row.person_type),
    },
    {
      key: "company_name",
      label: "Empresa",
      render: (row) => row.company_name || "-",
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
            {meta.total} terceros registrados
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

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50/90 px-4 pt-4">
          <div className="flex flex-nowrap gap-1 overflow-x-auto">
            {thirdTypeTabs.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setTableState((prev) => ({
                    ...prev,
                    typePerson: option.value,
                    page: 1,
                  }))
                }
                className={`${getTabButtonClassName(
                  typePerson === option.value,
                )} cursor-pointer`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable
            data={thirds}
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
            itemLabel="terceros"
          />
        )}
        </div>
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
