import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "../../services/orders.service";
import StatusBadge from "../../components/common/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      setOrders(data.data || []);
    } catch (error) {
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta orden?")) return;
    try {
      await ordersService.delete(id);
      toast.success("Orden eliminada exitosamente");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar");
    }
  };

  const handleFinish = async (id) => {
    if (!confirm("¿Marcar esta orden como terminada?")) return;
    try {
      await ordersService.markAsFinished(id);
      toast.success("Orden marcada como terminada");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar");
    }
  };

  const filtered = orders.filter(
    (order) =>
      order.id.toString().includes(search) ||
      order.order_status.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">
            Órdenes de Producción
          </h1>
          <p className="text-sm text-gray-500">
            {orders.length} órdenes en total
          </p>
        </div>
        <Button
          onClick={() => navigate("/orders/create")}
          className="bg-[#13529a] hover:bg-[#0f3f7a] text-white"
        >
          <Plus size={16} className="mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Buscar por ID o estado..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No se encontraron órdenes
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#13529a]/5">
                <TableHead className="text-[#13529a] font-semibold">
                  ID
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Cliente
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Fecha de Creación
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Entrega Est.
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Estado
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Hojas
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold">
                  Total Est.
                </TableHead>
                <TableHead className="text-[#13529a] font-semibold text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((header_production_orders) => (
                <TableRow
                  key={header_production_orders.id}
                  className="hover:bg-[#13529a]/5 transition-colors"
                >
                  <TableCell className="font-medium text-[#7694b6]">
                    #{header_production_orders.id}
                  </TableCell>
                  <TableCell>
                    {header_production_orders.product_customer?.third?.name}
                  </TableCell>
                  <TableCell>
                    {new Date(header_production_orders.date).toLocaleDateString(
                      "es-CO",
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      header_production_orders.date_delivery_estimated,
                    ).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={header_production_orders.order_status}
                    />
                  </TableCell>
                  <TableCell>
                    {header_production_orders.amount_sheets}
                  </TableCell>
                  <TableCell>
                    $
                    {header_production_orders.total_estimated?.toLocaleString(
                      "es-CO",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/orders/${header_production_orders.id}`)
                        }
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/orders/${header_production_orders.id}/edit`,
                          )
                        }
                        className="hover:text-[#13529a] hover:bg-[#13529a]/10"
                      >
                        <Pencil size={16} />
                      </Button>
                      {header_production_orders.order_status !==
                        "TERMINADO" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleFinish(header_production_orders.id)
                          }
                          className="hover:text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handleDelete(header_production_orders.id)
                        }
                        className="hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Orders;
