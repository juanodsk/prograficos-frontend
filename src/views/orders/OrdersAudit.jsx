import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import { connectSocket } from "@/services/socket.service";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Eye,
  Factory,
  FileSearch,
  Loader2,
  Package,
  Search,
  UserRound,
} from "lucide-react";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Sin registrar";

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin registrar";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin registrar";

const formatUserLabel = (user) => {
  if (!user) return "Sin registrar";
  const fullName = [user.name, user.surename].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Sin registrar";
};

const formatMeasureLabel = (measure) => {
  if (!measure) return "Sin registrar";
  const formatName = measure.format?.name || measure.format_name;
  const size =
    measure.width && measure.height
      ? `${measure.width} x ${measure.height}`
      : measure.name || "Medida sin definir";
  return formatName ? `${formatName} · ${size}` : size;
};

const displayFieldValue = (fieldValue) => {
  const rawValue = fieldValue?.value;
  if (rawValue == null || rawValue === "") return "Sin registrar";
  if (fieldValue?.field_definition?.field_type === "BOOLEAN") {
    return rawValue === "true" ? "Si" : "No";
  }
  return rawValue;
};

const OrdersAudit = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getAudit();
      setOrders(response.data || []);
    } catch {
      toast.error("Error al cargar la auditoría de órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    const handleProductionChange = () => {
      fetchAudit();
    };

    socket.on("production:changed", handleProductionChange);

    return () => {
      socket.off("production:changed", handleProductionChange);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return orders;

    return orders.filter((order) => {
      const client = order.product_customer?.third?.name?.toLowerCase() || "";
      const product = (
        order.product_customer?.name ||
        order.product_customer?.product?.name ||
        ""
      ).toLowerCase();
      const createdBy = formatUserLabel(order.user).toLowerCase();
      const closedBy = formatUserLabel(
        order.audit_summary?.closed_by,
      ).toLowerCase();

      return (
        String(order.id).includes(term) ||
        client.includes(term) ||
        product.includes(term) ||
        createdBy.includes(term) ||
        closedBy.includes(term) ||
        order.order_status?.toLowerCase().includes(term)
      );
    });
  }, [orders, search]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    const selectedExists = filteredOrders.some(
      (order) => order.id === selectedOrderId,
    );

    if (!selectedExists) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () =>
      filteredOrders.find((order) => order.id === selectedOrderId) ||
      filteredOrders[0] ||
      null,
    [filteredOrders, selectedOrderId],
  );

  const summary = useMemo(() => {
    const users = new Set();

    orders.forEach((order) => {
      order.detail_production_orders?.forEach((detail) => {
        if (detail.user?.id) users.add(detail.user.id);
      });
    });

    return {
      totalClosed: orders.length,
      deliveredTotal: orders.reduce(
        (total, order) => total + (order.audit_summary?.delivered_total || 0),
        0,
      ),
      damagedTotal: orders.reduce(
        (total, order) => total + (order.audit_summary?.damaged_total || 0),
        0,
      ),
      operators: users.size,
    };
  }, [orders]);

  const statCards = [
    {
      label: "Órdenes cerradas",
      value: summary.totalClosed,
      icon: FileSearch,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Unidades entregadas",
      value: summary.deliveredTotal.toLocaleString("es-CO"),
      icon: Package,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Unidades dañadas",
      value: summary.damagedTotal.toLocaleString("es-CO"),
      icon: Factory,
      tone: "bg-rose-100 text-rose-700",
    },
    {
      label: "Usuarios involucrados",
      value: summary.operators,
      icon: UserRound,
      tone: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#1f2937_0%,#0f3f7a_50%,#14532d_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">
              Trazabilidad
            </p>
            <h1 className="text-3xl font-bold">
              Auditoría de Órdenes Cerradas
            </h1>
            <p className="max-w-3xl text-sm text-emerald-100">
              Consulta el histórico completo de órdenes terminadas con la fecha,
              la hora, los usuarios involucrados y toda la información
              registrada durante el seguimiento de producción.
            </p>
          </div>

          <Button
            onClick={() =>
              selectedOrder && navigate(`/ordenes/${selectedOrder.id}`)
            }
            disabled={!selectedOrder}
            className="bg-white text-[#13529a] hover:bg-blue-50 cursor-pointer"
          >
            <Eye size={16} className="mr-2" />
            Abrir detalle operativo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
              <span className={`rounded-2xl p-3 ${card.tone}`}>
                <card.icon size={20} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Buscar por ID, cliente, producto o usuario..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#13529a]" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No se encontraron órdenes cerradas con ese criterio.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-17rem)] space-y-3 overflow-y-auto p-4">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const productName =
                  order.product_customer?.name ||
                  order.product_customer?.product?.name ||
                  "Sin producto";

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-[#13529a] bg-[#13529a]/5"
                        : "border-slate-200 bg-slate-50 hover:border-[#13529a]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Orden #{order.id}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {productName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {order.product_customer?.third?.name || "Sin cliente"}
                        </p>
                      </div>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Cierre
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(order.audit_summary?.closed_at)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Último responsable
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatUserLabel(order.audit_summary?.closed_by)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#13529a]" />
            </div>
          ) : !selectedOrder ? (
            <div className="py-16 text-center text-slate-500">
              Selecciona una orden cerrada para revisar su auditoría completa.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-17rem)] overflow-y-auto">
              <div className="border-b bg-slate-50 px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Auditoría detallada
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      Orden #{selectedOrder.id}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedOrder.product_customer?.name ||
                        selectedOrder.product_customer?.product?.name ||
                        "Sin producto"}{" "}
                      ·{" "}
                      {selectedOrder.product_customer?.third?.name ||
                        "Sin cliente"}
                    </p>
                  </div>
                  <StatusBadge status={selectedOrder.order_status} />
                </div>
              </div>

              <div className="space-y-6 p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Creada por
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatUserLabel(selectedOrder.user)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Fecha creación
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(selectedOrder.date)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Último cierre registrado
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(selectedOrder.audit_summary?.closed_at)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Cerrada por
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatUserLabel(selectedOrder.audit_summary?.closed_by)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Entrega estimada
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDate(selectedOrder.date_delivery_estimated)}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Formato y medida
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatMeasureLabel(selectedOrder.measure)}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Tipo de papel
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOrder.paper_type?.name || "Sin registrar"}
                      {selectedOrder.paper_type?.grammage
                        ? ` · ${selectedOrder.paper_type.grammage} gr`
                        : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Troquel
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOrder.troquel?.code ||
                        selectedOrder.troquel?.name ||
                        "Sin registrar"}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Hojas
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOrder.amount_sheets}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Totales auditados
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOrder.audit_summary?.delivered_total || 0}{" "}
                      entregadas ·{" "}
                      {selectedOrder.audit_summary?.damaged_total || 0} dañadas
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#13529a]" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      Seguimiento por proceso
                    </h3>
                  </div>

                  {selectedOrder.detail_production_orders?.map((detail) => (
                    <article
                      key={detail.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Proceso
                          </p>
                          <h4 className="mt-1 text-lg font-semibold text-slate-900">
                            {detail.process?.name || `Proceso #${detail.id}`}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {detail.process?.category || "Sin categoría"}
                          </p>
                        </div>
                        <StatusBadge status={detail.process_state} />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Responsable
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatUserLabel(detail.user)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Inicio
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatDate(detail.start_date)} ·{" "}
                            {formatTime(detail.start_hour)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Fin
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatDate(detail.end_date)} ·{" "}
                            {formatTime(detail.end_hour)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Unidades
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {detail.quantity_delivered || 0} entregadas ·{" "}
                            {detail.quantity_damaged || 0} dañadas
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Maquinaria
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {detail.machinery?.name || "Sin registrar"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3 md:col-span-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Observaciones
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {detail.observations ||
                              "Sin observaciones registradas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Campos diligenciados
                        </p>
                        {detail.field_values?.length ? (
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {detail.field_values.map((fieldValue) => (
                              <div
                                key={fieldValue.id}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                              >
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                  {fieldValue.field_definition?.label ||
                                    "Campo"}
                                </p>
                                <p className="mt-1 font-medium text-slate-900">
                                  {displayFieldValue(fieldValue)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                            Este proceso no tiene campos adicionales
                            registrados.
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrdersAudit;
