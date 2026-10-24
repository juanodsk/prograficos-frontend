import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { hasPermission } from "@/lib/permissions";
import quotationsService from "@/services/quotations.service";
import { formatCOP } from "@/lib/currency";

import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import QuotationPrintModal from "./QuotationPrintModal";
import usePersistedTableState from "../../hooks/usePersistedTableState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Eye,
  Printer,
  Loader2,
} from "lucide-react";

const defaultMeta = { page: 1, pageSize: 10, total: 0, totalPages: 1 };

const defaultTableState = {
  search: "",
  page: 1,
  pageSize: defaultMeta.pageSize,
  status: "",
};

const STATUS_STYLES = {
  BORRADOR: "bg-slate-100 text-slate-700",
  ENVIADA: "bg-blue-100 text-blue-800",
  APROBADA: "bg-emerald-100 text-emerald-800",
  VENCIDA: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  VENCIDA: "Vencida",
};

const STATUS_OPTIONS = ["BORRADOR", "ENVIADA", "APROBADA", "VENCIDA"];

const getClientLabel = (row) =>
  row.client?.snapshot?.companyName ||
  row.client?.snapshot?.name ||
  row.client?.contact?.company ||
  row.client?.contact?.name ||
  "Sin cliente";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-CO") : "—";

const Quotations = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const canCreate = hasPermission(currentUser, "quotations:create");
  const canUpdate = hasPermission(currentUser, "quotations:update");
  const canDelete = hasPermission(currentUser, "quotations:delete");

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(defaultMeta);
  const [tableState, setTableState] = usePersistedTableState(
    "quotations",
    defaultTableState,
  );
  const { search, page, pageSize, status } = tableState;
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    label: "",
    loading: false,
  });
  // Cotización cuya impresión se está previsualizando.
  const [printId, setPrintId] = useState(null);
  const [sendDialog, setSendDialog] = useState({
    isOpen: false,
    id: null,
    label: "",
    loading: false,
  });

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await quotationsService.getAll({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setQuotations(res?.data || []);
      setMeta(res?.meta || defaultMeta);
      if (res?.meta?.page && res.meta.page !== page) {
        setTableState((prev) => ({ ...prev, page: res.meta.page }));
      }
    } catch {
      toast.error("Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350,
    );
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSendClick = (row) =>
    setSendDialog({
      isOpen: true,
      id: row.id,
      label: row.quoteNumber,
      loading: false,
    });

  const handleCloseSendDialog = () => {
    if (sendDialog.loading) return;
    setSendDialog({ isOpen: false, id: null, label: "", loading: false });
  };

  const handleConfirmSend = async () => {
    setSendDialog((prev) => ({ ...prev, loading: true }));
    try {
      await quotationsService.send(sendDialog.id);
      toast.success("Cotización marcada como enviada");
      handleCloseSendDialog();
      await fetchQuotations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo enviar");
      setSendDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteClick = (row) =>
    setConfirmDialog({
      isOpen: true,
      id: row.id,
      label: row.quoteNumber,
      loading: false,
    });

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({ isOpen: false, id: null, label: "", loading: false });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      await quotationsService.remove(confirmDialog.id);
      toast.success("Cotización eliminada");
      handleCloseDialog();
      await fetchQuotations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo eliminar");
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    { key: "quoteNumber", label: "Número", sortable: false },
    {
      key: "client",
      label: "Cliente",
      sortable: false,
      render: (row) => getClientLabel(row),
    },
    {
      key: "serviceLine",
      label: "Línea",
      sortable: false,
      render: (row) => row.serviceLine?.name || "—",
    },
    {
      key: "items",
      label: "Productos",
      sortable: false,
      render: (row) => row.items?.length || 0,
    },
    {
      key: "granTotal",
      label: "Total",
      sortable: false,
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {formatCOP(row.granTotal)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      sortable: false,
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            STATUS_STYLES[row.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Creada",
      sortable: false,
      render: (row) => formatDate(row.fecha),
    },
  ];

  const actions = (row) => {
    const isDraft = row.status === "BORRADOR";
    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          title="Ver"
          onClick={() => navigate(`/cotizaciones/${row.id}`)}
          className="cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
        >
          <Eye size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          title="Imprimir"
          onClick={() => setPrintId(row.id)}
          className="cursor-pointer text-teal-700 hover:bg-teal-50 hover:text-teal-800"
        >
          <Printer size={16} />
        </Button>
        {canUpdate && isDraft && (
          <Button
            size="icon"
            variant="ghost"
            title="Editar"
            onClick={() => navigate(`/cotizaciones/${row.id}/editar`)}
            className="cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
          >
            <Pencil size={16} />
          </Button>
        )}
        {canUpdate && isDraft && (
          <Button
            size="icon"
            variant="ghost"
            title="Marcar como enviada"
            onClick={() => handleSendClick(row)}
            className="cursor-pointer text-[#13529a] hover:bg-[#0f3f7a] hover:bg-blue-50 hover:text-[#0f3f7a]"
          >
            <Send size={16} />
          </Button>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="ghost"
            title="Eliminar"
            onClick={() => handleDeleteClick(row)}
            className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Cotizaciones</h1>
          <p className="text-sm text-gray-500">
            {meta.total} cotizaciones registradas
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => navigate("/cotizaciones/crear")}
            className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
          >
            <Plus size={16} className="mr-2" />
            Nueva Cotización
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {loading && quotations.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable
            data={quotations}
            columns={columns}
            actions={actions}
            serverSide
            searchValue={search}
            onSearchChange={(value) =>
              setTableState((prev) => ({ ...prev, search: value, page: 1 }))
            }
            toolbarExtra={
              <Select
                value={status || "ALL"}
                onValueChange={(value) =>
                  setTableState((prev) => ({
                    ...prev,
                    status: value === "ALL" ? "" : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-[200px] cursor-pointer text-sm">
                  <SelectValue placeholder="Filtrar por estado">
                    {status ? STATUS_LABELS[status] : "Todos los estados"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            currentPage={meta.page}
            currentPageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) =>
              setTableState((prev) => ({ ...prev, page: nextPage }))
            }
            onPageSizeChange={(nextPageSize) =>
              setTableState((prev) => ({
                ...prev,
                pageSize: nextPageSize,
                page: 1,
              }))
            }
            itemLabel="cotizaciones"
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar cotización?"
        description={`Estás a punto de eliminar la cotización "${confirmDialog.label}". Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={sendDialog.isOpen}
        onClose={handleCloseSendDialog}
        onConfirm={handleConfirmSend}
        loading={sendDialog.loading}
        variant="info"
        icon={<Send className="h-6 w-6" />}
        loadingText="Enviando..."
        title="Información"
        description={`¿Está seguro de marcar como ENVIADA la cotización ${sendDialog.label}? Una vez enviada ya no se podrá editar.`}
        confirmText="Sí, marcar enviada"
        cancelText="Cancelar"
      />

      <QuotationPrintModal
        open={printId != null}
        quotationId={printId}
        onClose={() => setPrintId(null)}
      />
    </div>
  );
};

export default Quotations;
