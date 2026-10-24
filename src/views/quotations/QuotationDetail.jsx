import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import quotationsService from "@/services/quotations.service";
import { formatCOP } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";

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

const clientLabel = (q) =>
  q?.client?.snapshot?.companyName ||
  q?.client?.snapshot?.name ||
  q?.client?.contact?.company ||
  q?.client?.contact?.name ||
  "Sin cliente";

const formatDate = (v) => (v ? new Date(v).toLocaleDateString("es-CO") : "—");

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 font-medium text-slate-900">{value}</p>
  </div>
);

const Cell = ({ label, value, strong = false }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <p
      className={
        strong ? "font-bold text-[#13529a]" : "font-medium text-slate-800"
      }
    >
      {value}
    </p>
  </div>
);

const QuotationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    let active = true;
    quotationsService
      .getById(id)
      .then((res) => {
        if (!active) return;
        if (!res?.data) {
          toast.error("Cotización no encontrada");
          navigate("/cotizaciones");
          return;
        }
        setQuotation(res.data);
      })
      .catch(() => {
        if (active) {
          toast.error("Error al cargar la cotización");
          navigate("/cotizaciones");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[#13529a]" />
      </div>
    );
  }
  if (!quotation) return null;

  const q = quotation;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#13529a]">
            Cotización {q.quoteNumber}
          </h1>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              STATUS_STYLES[q.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {STATUS_LABELS[q.status] || q.status}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/cotizaciones")}
          className="cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>

      {/* Encabezado */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <Info label="Cliente" value={clientLabel(q)} />
          <Info label="Línea" value={q.serviceLine?.name || "—"} />
          <Info label="Fecha" value={formatDate(q.fecha)} />
          <Info label="Válido hasta" value={formatDate(q.validoHasta)} />
        </div>
      </section>

      {/* Lo que se cobra al cliente */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Resumen de productos
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.items || []).map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-slate-900">
                    {it.descripcionProducto}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCOP(it.costing?.valorUnitario)}
                  </TableCell>
                  <TableCell className="text-right">{it.cantidad}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCOP(
                      (it.costing?.valorUnitario || 0) * (it.cantidad || 0),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs italic text-slate-500">
            Los precios van antes de IVA si llegase a requerir.
          </p>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total
            </p>
            <p className="text-2xl font-bold text-[#13529a]">
              {formatCOP(q.granTotal)}
            </p>
          </div>
        </div>
      </section>

      {/* Análisis interno (no se muestra al cliente) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Análisis interno
        </h2>
        {(q.items || []).map((it, i) => {
          const c = it.costing || {};
          const margen = (c.totalCotizar || 0) - (c.subtotalCostos || 0);
          return (
            <div
              key={i}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-slate-900">
                <span className="font-semibold">
                  {" "}
                  Producto No. <span className="text-red-700">{i + 1}</span>
                  :{" "}
                </span>
                <em className="text-gray-700">{it.descripcionProducto}</em>
              </p>
              <div className="grid gap-2 text-sm md:grid-cols-4">
                <Cell
                  label="Papel"
                  value={`${it.papel?.name || "—"}${
                    it.papel?.grammage ? ` ${it.papel.grammage}gr` : ""
                  }`}
                />
                <Cell label="Proveedor" value={it.papel?.supplierName || "—"} />
                <Cell
                  label="Precio papel"
                  value={formatCOP(it.papel?.precioUnitario)}
                />
                <Cell
                  label="Formato / Tamaño"
                  value={`${it.formato?.name || "—"}${
                    it.medida?.label ? ` · ${it.medida.label}` : ""
                  }`}
                />
                <Cell label="Cavidad" value={it.cavidad} />
                <Cell label="Tintas" value={it.tintas} />
                <Cell label="Pliegos a comprar" value={c.pliegos} />
                <Cell label="Millares" value={c.millares} />
                <Cell label="Costo papel" value={formatCOP(c.precioPliegos)} />
                <Cell label="Impresión" value={formatCOP(c.precioImpresion)} />
                <Cell label="Planchas" value={formatCOP(c.precioPlanchas)} />
                <Cell label="Troquelado" value={formatCOP(c.troquelado)} />
                <Cell label="Plastificado" value={formatCOP(c.plastificado)} />
                <Cell
                  label="Subtotal costos"
                  value={formatCOP(c.subtotalCostos)}
                />
                <Cell label="Ganancia (margen)" value={formatCOP(margen)} />
                <Cell
                  label="Total producto"
                  value={formatCOP(c.totalCotizar)}
                  strong
                />
                <Cell
                  label="Valor unitario"
                  value={formatCOP(c.valorUnitario)}
                  strong
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default QuotationDetail;
