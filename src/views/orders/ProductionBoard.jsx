import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Activity, Factory, RefreshCw, TimerReset } from "lucide-react";
import ordersService from "@/services/orders.service";
import { connectSocket } from "@/services/socket.service";
import { Button } from "@/components/ui/button";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

const formatClock = (value) =>
  new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatLongDate = (value) =>
  new Date(value).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const getCurrentDetail = (order) => {
  const details = order?.detail_production_orders || [];
  return (
    details.find((detail) => detail.process_state === "EN_PROCESO") ||
    details.find((detail) => detail.process_state === "PENDIENTE") ||
    details[0] ||
    null
  );
};

const getCompletedSteps = (order) =>
  (order?.detail_production_orders || []).filter(
    (detail) => detail.process_state === "TERMINADO",
  ).length;

const getProgress = (order) => {
  const total = order?.detail_production_orders?.length || 0;
  if (!total) return 0;
  return Math.round((getCompletedSteps(order) / total) * 100);
};

const getDeadlineTone = (dateValue) => {
  if (!dateValue) return "text-slate-300";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "text-rose-300";
  if (diffDays <= 1) return "text-amber-300";
  return "text-emerald-300";
};

const getShortProductName = (order) =>
  order?.product_customer?.name ||
  order?.product_customer?.product?.name ||
  "Producto sin nombre";

const getClientName = (order) =>
  order?.product_customer?.third?.name || "Cliente sin definir";

const clampTwoLines = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const boardStatusConfig = {
  PENDIENTE:
    "bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/30",
  EN_PROCESO: "bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-500/30",
  TERMINADO:
    "bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-500/30",
};

const isOrderFinished = (order) => order?.order_status === "TERMINADO";

const hasDetailsInState = (order, state) =>
  (order?.detail_production_orders || []).some(
    (detail) => detail.process_state === state,
  );

const areAllDetailsFinished = (order) => {
  const details = order?.detail_production_orders || [];
  return (
    details.length > 0 &&
    details.every((detail) => detail.process_state === "TERMINADO")
  );
};

const getBoardOrderStatus = (order) => {
  if (isOrderFinished(order)) return "TERMINADO";
  if (hasDetailsInState(order, "EN_PROCESO")) return "EN_PROCESO";
  if (areAllDetailsFinished(order)) return "TERMINADO";
  if (hasDetailsInState(order, "PENDIENTE")) return "PENDIENTE";
  return order?.order_status || "PENDIENTE";
};

const kpiCards = [
  { key: "totalOrders", label: "Órdenes abiertas", icon: Factory },
  { key: "activeOrders", label: "En proceso", icon: Activity },
  { key: "activeProcesses", label: "Procesos activos", icon: TimerReset },
];

const BoardStatusBadge = ({ status }) => (
  <span
    className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
      boardStatusConfig[status] || "bg-slate-500/10 text-slate-200"
    }`}
  >
    {status === "EN_PROCESO"
      ? "En proceso"
      : status === "PENDIENTE"
        ? "Pendiente"
        : status === "TERMINADO"
          ? "Terminado"
          : status}
  </span>
);

const ProductionBoard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadOrders = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = await ordersService.getAll();
      setOrders(response?.data || []);
      setLastRefresh(new Date());
    } catch {
      toast.error("No se pudo cargar el monitor de planta");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const autoRefresh = window.setInterval(() => loadOrders(true), 60000);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(autoRefresh);
    };
  }, [loadOrders]);

  useEffect(() => {
    const socket = connectSocket();
    const handleProductionChange = () => {
      loadOrders(true);
    };

    socket.on("production:changed", handleProductionChange);

    return () => {
      socket.off("production:changed", handleProductionChange);
    };
  }, [loadOrders]);

  const boardOrders = useMemo(
    () => orders.filter((order) => !isOrderFinished(order)),
    [orders],
  );

  const activeOrders = useMemo(
    () =>
      boardOrders
        .filter((order) => getBoardOrderStatus(order) === "EN_PROCESO")
        .sort(
          (a, b) =>
            new Date(a.date_delivery_estimated) -
            new Date(b.date_delivery_estimated),
        ),
    [boardOrders],
  );

  const stats = useMemo(() => {
    const details = boardOrders.flatMap(
      (order) => order.detail_production_orders || [],
    );

    return {
      totalOrders: boardOrders.length,
      activeOrders: activeOrders.length,
      activeProcesses: details.filter(
        (detail) => detail.process_state === "EN_PROCESO",
      ).length,
    };
  }, [boardOrders, activeOrders]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <RefreshCw size={24} className="animate-spin" />
          Cargando monitor de planta...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#020617] text-white">
      <div className="grid min-h-screen w-full grid-rows-[auto_auto_minmax(0,1fr)] gap-4 p-5 2xl:gap-6 2xl:p-8">
        <header className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px]">
          <section className="rounded-[28px] border border-slate-800 bg-[#0b1220] px-8 py-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                Monitor de planta
              </p>
            </div>

            <h1 className="mt-4 text-[clamp(2.2rem,2.1vw,4rem)] font-black leading-none text-white">
              Producción en tiempo real
            </h1>
          </section>

          <section className="rounded-[28px] border border-slate-800 bg-[#0b1220] px-8 py-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
            <div className="flex h-full items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Hora actual
                </p>
                <p className="mt-2 whitespace-nowrap text-[clamp(3rem,3vw,5rem)] font-black leading-none tabular-nums text-white">
                  {formatClock(now)}
                </p>
                <p className="mt-2 text-lg capitalize text-slate-300">
                  {formatLongDate(now)}
                </p>
                {lastRefresh && (
                  <p className="mt-2 text-sm text-slate-400">
                    Última actualización: {formatClock(lastRefresh)}
                  </p>
                )}
              </div>
            </div>
          </section>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {kpiCards.map((card) => (
            <article
              key={card.key}
              className="rounded-[24px] border border-slate-800 bg-[#0b1220] px-6 py-5 shadow-[0_10px_30px_rgba(2,6,23,0.25)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-[clamp(2rem,2vw,3.5rem)] font-black leading-none text-white">
                    {stats[card.key]}
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-200">
                  <card.icon size={24} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-[28px] border border-slate-800 bg-[#0b1220] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)] 2xl:p-8">
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-[clamp(1.4rem,1.1vw,2rem)] font-black text-white">
                Órdenes en producción
              </h2>
              <p className="mt-1 text-base text-slate-400">
                Visual principal de órdenes activas
              </p>
            </div>

            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200">
              {activeOrders.length} activas
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex items-center justify-center rounded-[24px] border border-dashed border-slate-800 bg-slate-950/30 px-8 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Sin actividad en curso
                </p>
                <p className="mt-4 text-[clamp(2.5rem,2.2vw,4rem)] font-black leading-none text-white">
                  No hay órdenes en proceso
                </p>
              </div>
            </div>
          ) : (
            <div className="grid min-h-0 gap-4 overflow-hidden auto-rows-fr">
              {activeOrders.map((order) => {
                const currentDetail = getCurrentDetail(order);
                const progress = getProgress(order);
                const boardStatus = getBoardOrderStatus(order);

                return (
                  <article
                    key={order.id}
                    className="grid min-h-[160px] grid-cols-[180px_minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(340px,1.5fr)] rounded-[24px] border border-slate-800 bg-[#0f172a] overflow-hidden"
                  >
                    <div className="flex flex-col justify-center border-r border-slate-800 bg-slate-950/50 px-6">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Orden
                      </p>
                      <p className="mt-3 text-[clamp(2.2rem,1.9vw,3.2rem)] font-black leading-none text-white">
                        #{order.id}
                      </p>
                      <div className="mt-4">
                        <BoardStatusBadge status={boardStatus} />
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center border-r border-slate-800 px-6">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Producto
                      </p>
                      <h3
                        className="mt-2 text-[clamp(1.45rem,1.1vw,2rem)] font-black leading-tight text-white"
                        style={clampTwoLines}
                      >
                        {getShortProductName(order)}
                      </h3>

                      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Cliente
                      </p>
                      <p
                        className="mt-2 text-[clamp(1rem,0.78vw,1.12rem)] text-slate-300"
                        style={clampTwoLines}
                      >
                        {getClientName(order)}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center border-r border-slate-800 px-6">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Proceso actual
                      </p>
                      <p className="mt-2 text-[clamp(1.2rem,0.92vw,1.5rem)] font-bold text-white">
                        {currentDetail?.process?.name || "Sin proceso"}
                      </p>

                      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Operario
                      </p>
                      <p
                        className="mt-2 text-[clamp(0.98rem,0.76vw,1.08rem)] text-slate-300"
                        style={clampTwoLines}
                      >
                        {currentDetail?.user
                          ? `${currentDetail.user.name} ${currentDetail.user.surename || ""}`.trim()
                          : "Sin operario"}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center border-r border-slate-800 px-6">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Maquinaria
                      </p>
                      <p
                        className="mt-2 text-[clamp(1.15rem,0.9vw,1.45rem)] font-bold text-white"
                        style={clampTwoLines}
                      >
                        {currentDetail?.machinery?.name || "Sin maquinaria"}
                      </p>
                      <p className="mt-2 text-[clamp(0.95rem,0.74vw,1.05rem)] text-slate-300">
                        Cod. {currentDetail?.machinery?.reference || "--"}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center px-6">
                      <div className="grid grid-cols-[1fr_160px] items-start gap-6">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            Entrega
                          </p>
                          <p
                            className={`mt-2 text-[clamp(1.2rem,0.95vw,1.55rem)] font-bold leading-tight ${getDeadlineTone(order.date_delivery_estimated)}`}
                          >
                            {formatDate(order.date_delivery_estimated)}
                          </p>
                          <p className="mt-2 text-[clamp(0.95rem,0.74vw,1.05rem)] text-slate-300">
                            {order.amount_sheets ?? 0} pliegos
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            Avance
                          </p>
                          <p className="mt-2 text-[clamp(2.2rem,1.8vw,3rem)] font-black leading-none text-white">
                            {progress}%
                          </p>
                          <p className="mt-2 text-[clamp(0.95rem,0.74vw,1.02rem)] text-slate-300">
                            {getCompletedSteps(order)} /{" "}
                            {order.detail_production_orders?.length || 0}{" "}
                            procesos
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-900">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductionBoard;
