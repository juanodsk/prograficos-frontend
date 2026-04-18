import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ServerPagination from "../../components/common/ServerPagination";
import ordersService from "@/services/orders.service";
import { connectSocket } from "@/services/socket.service";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Eye,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Rows3,
  Search,
  Trash2,
} from "lucide-react";

const defaultMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const defaultSummary = {
  total: 0,
  pending: 0,
  progress: 0,
  finished: 0,
};

const defaultTabs = {
  active: 0,
  finished: 0,
};

const finishedStatuses = new Set(["TERMINADO", "ENTREGADO"]);

const isFinishedOrder = (order) => finishedStatuses.has(order?.order_status);

const formatShortDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-CO") : "Sin fecha";

const getOrderProductLabel = (order) =>
  order?.product?.name ||
  order?.product?.troquel?.code ||
  order?.troquel?.code ||
  `Orden #${order?.id ?? ""}`;

const getOrderClientLabel = (order) =>
  order?.product?.third?.company_name ||
  order?.product?.third?.name ||
  "Sin cliente";

const Orders = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode, setViewMode] = useState("table");
  const [pageByTab, setPageByTab] = useState({
    active: 1,
    finished: 1,
  });
  const [pageSize, setPageSize] = useState(defaultMeta.pageSize);
  const [meta, setMeta] = useState(defaultMeta);
  const [summary, setSummary] = useState(defaultSummary);
  const [tabCounts, setTabCounts] = useState(defaultTabs);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    orderId: null,
    orderName: "",
    loading: false,
  });

  const canDeleteOrder = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);
  const canCreate = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);
  const canEdit = ["ADMIN", "SUPERVISOR"].includes(currentUser?.role);

  const fetchOrders = useCallback(
    async ({
      tab = activeTab,
      page = pageByTab[tab],
      pageSizeValue = pageSize,
      searchValue = debouncedSearch,
    } = {}) => {
      try {
        setLoading(true);
        const response = await ordersService.getAll({
          statusGroup: tab,
          page,
          pageSize: pageSizeValue,
          search: searchValue || undefined,
        });

        setOrders(response?.data || []);
        setMeta(response?.meta || defaultMeta);
        setSummary(response?.summary || defaultSummary);
        setTabCounts(response?.tabs || defaultTabs);

        if (response?.meta?.page && response.meta.page !== page) {
          setPageByTab((prev) => ({
            ...prev,
            [tab]: response.meta.page,
          }));
        }
      } catch {
        toast.error("Error al cargar las órdenes");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, debouncedSearch, pageByTab, pageSize],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socket = connectSocket();
    const handleProductionChange = () => {
      fetchOrders();
    };

    socket.on("production:changed", handleProductionChange);

    return () => {
      socket.off("production:changed", handleProductionChange);
    };
  }, [fetchOrders]);

  const handleDeleteClick = (order) => {
    setConfirmDialog({
      isOpen: true,
      orderId: order.id,
      orderName: getOrderProductLabel(order),
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      orderId: null,
      orderName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));

    try {
      const response = await ordersService.delete(confirmDialog.orderId);
      toast.success(response?.message || "Orden desactivada exitosamente");
      handleCloseDialog();
      await fetchOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo eliminar la orden",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleFinish = async (id) => {
    toast.custom((toastId) => (
      <div className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
            <CheckCircle size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Marcar orden como terminada
            </p>
            <p className="text-sm text-slate-500">
              La orden pasar&aacute; a estado{" "}
              <span className="font-semibold text-slate-700">TERMINADO</span>.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.dismiss(toastId);
              toast.info("Acción cancelada");
            }}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                await ordersService.markAsFinished(id);
                toast.success("Orden marcada como terminada");
                await fetchOrders();
              } catch (error) {
                toast.error(
                  error.response?.data?.message || "Error al actualizar",
                );
              }
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
          >
            Confirmar
          </Button>
        </div>
      </div>
    ));
  };

  const statCards = [
    {
      label: "Total",
      value: summary.total,
      tone: "text-slate-800 bg-slate-100",
    },
    {
      label: "Pendientes",
      value: summary.pending,
      tone: "text-amber-700 bg-amber-100",
    },
    {
      label: "En proceso",
      value: summary.progress,
      tone: "text-blue-700 bg-blue-100",
    },
    {
      label: "Terminadas",
      value: summary.finished,
      tone: "text-emerald-700 bg-emerald-100",
    },
  ];

  const tabOptions = [
    {
      key: "active",
      label: "Órdenes activas",
      count: tabCounts.active,
    },
    {
      key: "finished",
      label: "Órdenes terminadas",
      count: tabCounts.finished,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f3f7a_0%,#13529a_55%,#2b6cb0_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-100">
              Producción
            </p>
            <h1 className="text-3xl font-bold">Órdenes de Producción</h1>
            <p className="max-w-2xl text-sm text-blue-100">
              Consulta el estado de cada orden, revisa su flujo de procesos y
              entra al detalle operativo sin depender de la hoja física.
            </p>
          </div>

          {canCreate && (
            <Button
              onClick={() => navigate("/ordenes/crear")}
              className="bg-white text-[#13529a] hover:bg-blue-50 cursor-pointer"
            >
              <Plus size={16} className="mr-2" />
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${card.tone}`}
              >
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full rounded-2xl bg-slate-100 p-1 lg:w-auto">
              {tabOptions.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-xl px-4 py-2 cursor-pointer text-sm font-semibold transition-colors lg:flex-none ${
                    activeTab === tab.key
                      ? "bg-white text-[#13529a] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-[#13529a] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#13529a] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Rows3 size={16} />
                </button>
              </div>

              <div className="relative max-w-md">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Buscar por cliente, producto, ID o estado..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPageByTab({
                      active: 1,
                      finished: 1,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {activeTab === "finished"
              ? "No se encontraron órdenes terminadas con ese criterio."
              : "No se encontraron órdenes activas con ese criterio."}
          </div>
        ) : (
          <>
            {viewMode === "cards" ? (
              <div className="grid gap-4 p-4 lg:grid-cols-2">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-[#13529a]/40 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Orden #{order.id}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                          {getOrderProductLabel(order)}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {getOrderClientLabel(order)}
                        </p>
                      </div>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Creación
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatShortDate(order.date)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Hojas
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {order.amount_sheets}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Unidades estimadas
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {order.total_estimated?.toLocaleString("es-CO")}{" "}
                          unidades
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/ordenes/${order.id}`)}
                        className="cursor-pointer"
                      >
                        <Eye size={16} className="mr-2" />
                        Ver detalle
                      </Button>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/ordenes/${order.id}/editar`)
                          }
                          className="cursor-pointer"
                        >
                          <Pencil size={16} className="mr-2" />
                          Editar
                        </Button>
                      )}
                      {!isFinishedOrder(order) && (
                        <Button
                          size="sm"
                          onClick={() => handleFinish(order.id)}
                          className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Terminar
                        </Button>
                      )}
                      {canDeleteOrder && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(order)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Orden</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Creación</TableHead>
                        <TableHead>Hojas</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-semibold text-slate-900">
                            #{order.id}
                          </TableCell>
                          <TableCell>{getOrderProductLabel(order)}</TableCell>
                          <TableCell>{getOrderClientLabel(order)}</TableCell>
                          <TableCell>{formatShortDate(order.date)}</TableCell>
                          <TableCell>{order.amount_sheets}</TableCell>
                          <TableCell>
                            {order.total_estimated?.toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.order_status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/ordenes/${order.id}`)}
                                className="cursor-pointer"
                              >
                                <Eye size={16} className="mr-2" />
                                Ver
                              </Button>
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(`/ordenes/${order.id}/editar`)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Pencil size={16} className="mr-2" />
                                  Editar
                                </Button>
                              )}
                              {!isFinishedOrder(order) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleFinish(order.id)}
                                  className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                                >
                                  <CheckCircle size={16} className="mr-2" />
                                  Terminar
                                </Button>
                              )}
                              {canDeleteOrder && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(order)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Eliminar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <ServerPagination
              page={meta.page}
              pageSize={meta.pageSize}
              total={meta.total}
              totalPages={meta.totalPages}
              itemLabel="órdenes"
              onPageChange={(nextPage) =>
                setPageByTab((prev) => ({
                  ...prev,
                  [activeTab]: nextPage,
                }))
              }
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPageByTab({
                  active: 1,
                  finished: 1,
                });
              }}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar orden?"
        description={`Estás a punto de eliminar la orden "${confirmDialog.orderName}". Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Orders;
