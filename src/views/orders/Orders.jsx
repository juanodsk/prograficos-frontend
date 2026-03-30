import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Eye, Loader2, Pencil, Plus, Search } from "lucide-react";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      setOrders(data.data || []);
    } catch {
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const client = order.product_customer?.third?.name?.toLowerCase() || "";
      const product = order.product_customer?.name?.toLowerCase() || "";
      return (
        String(order.id).includes(term) ||
        order.order_status?.toLowerCase().includes(term) ||
        client.includes(term) ||
        product.includes(term)
      );
    });
  }, [orders, search]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.order_status === "PENDIENTE").length,
      progress: orders.filter((order) => order.order_status === "EN_PROCESO").length,
      finished: orders.filter((order) => order.order_status === "TERMINADO").length,
    }),
    [orders],
  );

  const handleFinish = async (id) => {
    toast.custom((toastId) => (
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
            <CheckCircle size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Marcar orden como terminada
            </p>
            <p className="text-sm text-slate-500">
              La orden pasar&aacute; a estado <span className="font-semibold text-slate-700">TERMINADO</span>.
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
                fetchOrders();
              } catch (error) {
                toast.error(error.response?.data?.message || "Error al actualizar");
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
    { label: "Total", value: summary.total, tone: "text-slate-800 bg-slate-100" },
    { label: "Pendientes", value: summary.pending, tone: "text-amber-700 bg-amber-100" },
    { label: "En proceso", value: summary.progress, tone: "text-blue-700 bg-blue-100" },
    { label: "Terminadas", value: summary.finished, tone: "text-emerald-700 bg-emerald-100" },
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
              Consulta el estado de cada orden, revisa su flujo de procesos y entra
              al detalle operativo sin depender de la hoja física.
            </p>
          </div>

          <Button
            onClick={() => navigate("/ordenes/crear")}
            className="bg-white text-[#13529a] hover:bg-blue-50 cursor-pointer"
          >
            <Plus size={16} className="mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${card.tone}`}>
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Buscar por cliente, producto, ID o estado..."
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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No se encontraron órdenes con ese criterio.
          </div>
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {filtered.map((order) => (
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
                      {order.product_customer?.name ||
                        order.product_customer?.product?.name ||
                        "Sin producto"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {order.product_customer?.third?.name || "Sin cliente"}
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
                      {new Date(order.date).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Entrega estimada
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {new Date(order.date_delivery_estimated).toLocaleDateString(
                        "es-CO",
                      )}
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
                      Total estimado
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      ${order.total_estimated?.toLocaleString("es-CO")}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/ordenes/${order.id}/editar`)}
                    className="cursor-pointer"
                  >
                    <Pencil size={16} className="mr-2" />
                    Editar
                  </Button>
                  {order.order_status !== "TERMINADO" && (
                    <Button
                      size="sm"
                      onClick={() => handleFinish(order.id)}
                      className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Terminar
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
