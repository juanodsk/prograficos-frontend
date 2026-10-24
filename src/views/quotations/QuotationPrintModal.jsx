import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import quotationsService from "@/services/quotations.service";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X } from "lucide-react";
import logoPrograficos from "@/assets/images/logo-prograficos-horizontal.png";

const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const money = (v) => `$ ${nf.format(Number(v) || 0)}`;
const fechaCorta = (v) => (v ? new Date(v).toLocaleDateString("es-CO") : "—");

// Filas mínimas para conservar el aspecto del formato impreso.
const MIN_ROWS = 6;

const clientLabel = (q) =>
  q?.client?.snapshot?.companyName ||
  q?.client?.snapshot?.name ||
  q?.client?.contact?.company ||
  q?.client?.contact?.name ||
  "-";

export default function QuotationPrintModal({ open, onClose, quotationId }) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Cotizacion-${quotation?.quoteNumber ?? ""}`,
    pageStyle: `
      @page { size: auto; margin: 12mm; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  useEffect(() => {
    if (!open || !quotationId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await quotationsService.getById(quotationId);
        if (active) setQuotation(res?.data || null);
      } catch {
        toast.error("No se pudo cargar la cotización para imprimir");
        onClose();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // onClose cambia por render; no debe reejecutar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quotationId]);

  if (!open) return null;

  const q = quotation;
  const lines = (q?.items || []).map((it) => {
    const unit = it.costing?.valorUnitario || 0;
    const quantity = it.cantidad || 0;
    return {
      description: it.descripcionProducto || "Sin descripción",
      unit,
      quantity,
      total: unit * quantity,
    };
  });
  const grandTotal = q?.granTotal ?? lines.reduce((acc, l) => acc + l.total, 0);
  const fillerRows = Math.max(0, MIN_ROWS - lines.length);

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
            <p className="text-xs text-gray-500">
              Cotización {q?.quoteNumber ?? ""}
            </p>
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
            <div
              ref={printRef}
              className="mx-auto w-full max-w-[720px] bg-white p-6 text-[13px] text-black"
            >
              <table className="w-full border-collapse">
                <tbody>
                  {/* Logo de la empresa (centrado y responsive) */}
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center">
                      <img
                        src={logoPrograficos}
                        alt="Prográficos"
                        className="mx-auto h-auto w-full max-w-[280px]"
                      />
                    </td>
                  </tr>
                  {/* Fecha / Cotización No */}
                  <tr>
                    <td className="w-[18%] text-right border border-black px-2 py-1 font-bold">
                      FECHA
                    </td>
                    <td
                      colSpan={2}
                      className="border border-black px-2 py-1 text-center"
                    >
                      {fechaCorta(q?.fecha)}
                    </td>
                    <td className="border border-black px-2 py-1 font-bold">
                      <span className="text-red-700">{q?.quoteNumber}</span>
                    </td>
                  </tr>
                  {/* Nombre */}
                  <tr>
                    <td className="border text-right border-black px-2 py-1 font-bold">
                      CLIENTE
                    </td>
                    <td
                      colSpan={3}
                      className="border  border-black px-2 py-1 text-center font-semibold"
                    >
                      {clientLabel(q)}
                    </td>
                  </tr>
                  {/* Validez */}
                  <tr>
                    <td className="border text-right border-black px-2 py-1 font-bold">
                      VÁLIDA HASTA
                    </td>
                    <td
                      colSpan={3}
                      className="border border-black px-2 py-1 text-center"
                    >
                      {fechaCorta(q?.validoHasta)}
                    </td>
                  </tr>
                  {/* Separador */}
                  <tr>
                    <td colSpan={4} className="py-1"></td>
                  </tr>
                  {/* Encabezado de la tabla */}
                  <tr className="bg-[#9db3d4] font-bold">
                    <td className="w-[52%] border border-black px-2 py-1 text-center">
                      PRODUCTO
                    </td>
                    <td className="w-[18%] border border-black px-2 py-1 text-center">
                      PRECIO UNIT.
                    </td>
                    <td className="w-[14%] border border-black px-2 py-1 text-center">
                      CANTIDAD
                    </td>
                    <td className="w-[16%] border border-black px-2 py-1 text-center">
                      SUBTOTAL
                    </td>
                  </tr>
                  {/* Líneas */}
                  {lines.map((l, i) => (
                    <tr key={`line-${i}`}>
                      <td className="border border-black px-2 py-1">
                        {l.description}
                      </td>
                      <td className="border border-black px-2 py-1 text-right">
                        {money(l.unit)}
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        {nf.format(l.quantity)}
                      </td>
                      <td className="border border-black px-2 py-1 text-right">
                        {money(l.total)}
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
                    </tr>
                  ))}
                  {/* Pie: Total */}
                  <tr>
                    <td
                      colSpan={2}
                      className="border border-black bg-[#9db3d4] px-2 py-2 text-center font-bold"
                    >
                      PROGRÁFICOS SAS
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-bold">
                      TOTAL
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-bold">
                      {money(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[11px] italic text-slate-600">
                Los precios van antes de IVA si llegase a requerir.
              </p>
            </div>
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
            disabled={loading || !q}
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
