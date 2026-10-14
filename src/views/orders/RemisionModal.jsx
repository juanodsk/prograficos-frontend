import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Printer,
  X,
  AlertTriangle,
  Pencil,
  Check,
} from "lucide-react";

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

// Fecha de impresión (hoy) en formato "07 OCTUBRE DEL 2026".
const fechaHoy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} DEL ${d.getFullYear()}`;
};

const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const money = (v) => `$ ${nf.format(Number(v) || 0)}`;

// Filas mínimas para que la tabla conserve el aspecto del formato impreso.
const MIN_ROWS = 6;

export default function RemisionModal({ open, onClose, orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  // Cantidad a facturar: editable SOLO para esta impresión (no toca la BD).
  const [qtyOverride, setQtyOverride] = useState("");
  const [editingQty, setEditingQty] = useState(false);
  const qtyBeforeEdit = useRef("");
  const qtyInputRef = useRef(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Remision-orden-${orderId ?? ""}`,
    // Forzamos la impresión de fondos de color (el navegador los omite por
    // defecto): así el encabezado azul y los bordes salen en papel/PDF.
    pageStyle: `
      @page { size: auto; margin: 12mm; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  useEffect(() => {
    if (!open || !orderId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await ordersService.getById(orderId);
        if (active) {
          const data = res?.data || null;
          setOrder(data);
          setQtyOverride(
            String(data?.total_real_delivered ?? data?.total_delivered ?? 0),
          );
          setEditingQty(false);
        }
      } catch {
        toast.error("No se pudo cargar la orden para la remisión");
        onClose();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // onClose se usa dentro pero no debe reejecutar el efecto (cambia por render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  // Al entrar en edición, enfocar y seleccionar el input de cantidad.
  useEffect(() => {
    if (!editingQty) return;
    const t = setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [editingQty]);

  if (!open) return null;

  const product = order?.product || null;
  const client = product?.third || null;
  const price = product?.sale_price != null ? Number(product.sale_price) : null;
  const hasPrice = price != null && price > 0;
  // Unidades realmente entregadas (de la BD, solo referencia).
  const deliveredQty =
    order?.total_real_delivered ?? order?.total_delivered ?? 0;
  // Cantidad que se imprime = la editable (puede ser menor por holgura).
  const quantity = Number(qtyOverride) || 0;

  // Línea(s) de la remisión. Hoy una orden = un producto = una línea.
  const lines = order
    ? [
        {
          reference: product?.code || "-",
          quantity,
          description: product?.name || "Sin descripción",
          unit: price,
          total: hasPrice ? price * quantity : 0,
        },
      ]
    : [];
  const grandTotal = lines.reduce((acc, l) => acc + l.total, 0);
  const fillerRows = Math.max(0, MIN_ROWS - lines.length);

  // ── Edición inline de la cantidad ──
  const startEditQty = () => {
    qtyBeforeEdit.current = qtyOverride; // snapshot para poder cancelar
    setEditingQty(true);
  };
  const acceptEditQty = () => {
    const n = Number(qtyOverride);
    // No permitido: vacío, 0, negativo o mayor a lo entregado.
    if (!qtyOverride || Number.isNaN(n) || n <= 0 || n > deliveredQty) {
      toast.error(
        `Valor no permitido. La cantidad debe estar entre 1 y ${nf.format(deliveredQty)} (lo entregado).`,
      );
      setQtyOverride(String(deliveredQty)); // vuelve al valor entregado original
      setEditingQty(false);
      return;
    }
    setEditingQty(false);
  };
  const cancelEditQty = () => {
    setQtyOverride(qtyBeforeEdit.current); // vuelve al valor original
    setEditingQty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              Vista previa Impresión
            </h2>
            <p className="text-xs text-gray-500">Orden #{orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <>
              {!hasPrice && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>
                    No es posible imprimir la orden porque algún producto no
                    tiene precio asignado.
                  </span>
                </div>
              )}

              {hasPrice && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Entregadas:{" "}
                  <span className="font-semibold text-slate-700">
                    {nf.format(deliveredQty)}
                  </span>
                  . Puedes ajustar la <strong>cantidad</strong> a facturar solo
                  para esta impresión; no modifica la orden original.
                </div>
              )}

              {/* Documento imprimible */}
              <div
                ref={printRef}
                className="mx-auto w-full max-w-[720px] bg-white p-6 text-[13px] text-black"
              >
                <table className="w-full border-collapse">
                  <tbody>
                    {/* Título */}
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-black bg-[#9db3d4] px-2 py-2 text-center text-lg font-bold"
                      >
                        REMISIÓN
                      </td>
                    </tr>
                    {/* Fecha / Orden No */}
                    <tr>
                      <td className="w-[18%] border border-black px-2 py-1 font-bold">
                        FECHA:
                      </td>
                      <td
                        colSpan={3}
                        className="border border-black px-2 py-1 text-center"
                      >
                        {fechaHoy()}
                      </td>
                      <td className="border border-black px-2 py-1 font-bold">
                        ORDEN No:{" "}
                        <span className="text-red-700">
                          {String(order?.id ?? "").padStart(4, "0")}
                        </span>
                      </td>
                    </tr>
                    {/* Nombre */}
                    <tr>
                      <td className="border border-black px-2 py-1 font-bold">
                        NOMBRE:
                      </td>
                      <td
                        colSpan={4}
                        className="border border-black px-2 py-1 text-center font-semibold"
                      >
                        {client?.company_name || client?.name || "-"}
                      </td>
                    </tr>
                    {/* Separador */}
                    <tr>
                      <td colSpan={5} className="py-1"></td>
                    </tr>
                    {/* Encabezado de la tabla */}
                    <tr className="bg-[#9db3d4] font-bold">
                      <td className="border border-black px-2 py-1 text-center">
                        REFERENCIA
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        DESCRIPCIÓN
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        CANTIDAD
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        VALOR UNITARIO
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        TOTAL
                      </td>
                    </tr>
                    {/* Líneas */}
                    {lines.map((l, i) => (
                      <tr key={`line-${i}`}>
                        <td className="border border-black px-2 py-1 text-center">
                          {l.reference}
                        </td>
                        <td className="border border-black px-2 py-1">
                          {l.description}
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              ref={qtyInputRef}
                              type="text"
                              inputMode="numeric"
                              value={qtyOverride}
                              disabled={!editingQty}
                              title={`Entregadas: ${nf.format(deliveredQty)} (máx.)`}
                              onChange={(e) => {
                                const digits = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                if (digits === "") {
                                  setQtyOverride("");
                                  return;
                                }
                                // No puede facturar más de lo entregado.
                                setQtyOverride(
                                  String(
                                    Math.min(Number(digits), deliveredQty),
                                  ),
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") acceptEditQty();
                                if (e.key === "Escape") cancelEditQty();
                              }}
                              className="w-16 bg-transparent text-center font-semibold text-black outline-none disabled:cursor-default disabled:opacity-100"
                            />
                            <span className="flex items-center gap-0.5 print:hidden">
                              {!editingQty ? (
                                <button
                                  type="button"
                                  title="Editar cantidad"
                                  onClick={startEditQty}
                                  className="cursor-pointer text-slate-400 transition-colors hover:text-[#13529a]"
                                >
                                  <Pencil size={13} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    title="Aceptar"
                                    onClick={acceptEditQty}
                                    className="cursor-pointer text-blue-700 transition-colors hover:text-blue-800"
                                  >
                                    <Check size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Cancelar edición"
                                    onClick={cancelEditQty}
                                    className="cursor-pointer text-red-700 transition-colors hover:text-red-800"
                                  >
                                    <X size={15} />
                                  </button>
                                </>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="border border-black px-2 py-1 text-right">
                          {hasPrice ? money(l.unit) : "-"}
                        </td>
                        <td className="border border-black px-2 py-1 text-right">
                          {hasPrice ? money(l.total) : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Filas en blanco para conservar el formato */}
                    {Array.from({ length: fillerRows }).map((_, i) => (
                      <tr key={`filler-${i}`}>
                        <td className="border border-black px-2 py-3"></td>
                        <td className="border border-black px-2 py-3"></td>
                        <td className="border border-black px-2 py-3"></td>
                        <td className="border border-black px-2 py-3"></td>
                        <td className="border border-black px-2 py-3"></td>
                      </tr>
                    ))}
                    {/* Pie: Prográficos / Total */}
                    <tr>
                      <td
                        colSpan={3}
                        className="border border-black bg-[#9db3d4] px-2 py-2 text-center font-bold"
                      >
                        PROGRÁFICOS
                        <div className="mt-6 font-semibold">NOMBRE Y FIRMA</div>
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-bold">
                        TOTAL
                      </td>
                      <td className="border border-black px-2 py-1 text-right font-bold">
                        {hasPrice ? money(grandTotal) : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t px-5 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 cursor-pointer"
          >
            Cerrar
          </Button>
          <Button
            onClick={handlePrint}
            disabled={loading || !order || !hasPrice}
            className="flex-1 cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer size={16} className="mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}
