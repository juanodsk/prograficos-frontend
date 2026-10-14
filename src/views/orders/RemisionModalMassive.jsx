import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Loader2,
  Printer,
  X,
  AlertTriangle,
  Pencil,
  Check,
  Plus,
  Trash2,
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
const pad = (n) => String(n).padStart(2, "0");
const fechaHoy = () => {
  const d = new Date();
  return `${pad(d.getDate())} ${MESES[d.getMonth()]} DEL ${d.getFullYear()}`;
};
const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const money = (v) => `$ ${nf.format(Number(v) || 0)}`;
const MIN_ROWS = 6;

// Código único de impresión: usa la fecha/hora del sistema + sufijo aleatorio.
const buildPrintCode = () => {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(-2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MSV-${date}-${rand}`; // p. ej. MSV-261014-K7Q
};

const clientNameOf = (order) =>
  order?.product?.third?.company_name || order?.product?.third?.name || null;

// Fecha corta dd/mm/aaaa para la subtabla.
const fmtShortDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "-"
    : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function RemisionModalMassive({ open, onClose }) {
  const [finishedOrders, setFinishedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); // { key, name }
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [lines, setLines] = useState([]); // órdenes agregadas a la remisión
  const [adding, setAdding] = useState(false);
  const [printCode, setPrintCode] = useState("");
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Remision-masiva-${printCode}`,
    pageStyle: `
      @page { size: auto; margin: 12mm; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  // Al abrir: cargar órdenes terminadas y resetear todo.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setSelectedClient(null);
    setCheckedIds(new Set());
    setLines([]);
    setPrintCode(buildPrintCode());
    (async () => {
      try {
        setLoading(true);
        const res = await ordersService.getAll({
          statusGroup: "finished",
          pageSize: 1000,
        });
        if (active) setFinishedOrders(res?.data || []);
      } catch {
        toast.error("No se pudieron cargar las órdenes terminadas");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  // Clientes únicos (por nombre) de las órdenes terminadas.
  const clients = useMemo(() => {
    const map = new Map();
    for (const o of finishedOrders) {
      const name = clientNameOf(o);
      if (name && !map.has(name)) map.set(name, { key: name, name });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [finishedOrders]);

  // Órdenes terminadas del cliente elegido.
  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return finishedOrders
      .filter((o) => clientNameOf(o) === selectedClient.key)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // más recientes arriba
  }, [finishedOrders, selectedClient]);

  if (!open) return null;

  const onSelectClient = (client) => {
    setSelectedClient(client || null);
    setCheckedIds(new Set());
    setLines([]); // una remisión = un solo cliente
  };

  const toggleCheck = (id) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Mínimo 2 en la primera selección; luego basta 1 para seguir agregando.
  const minToAdd = lines.length > 0 ? 1 : 2;
  const canAdd = checkedIds.size >= minToAdd;

  const handleAgregar = async () => {
    if (!canAdd) {
      toast.error(
        lines.length > 0
          ? "Selecciona al menos una orden."
          : "Selecciona al menos 2 órdenes para una impresión masiva.",
      );
      return;
    }
    const toAdd = [...checkedIds].filter(
      (id) => !lines.some((l) => l.orderId === id),
    );
    if (!toAdd.length) {
      toast.error("Esas órdenes ya están agregadas.");
      return;
    }
    try {
      setAdding(true);
      const results = await Promise.all(
        toAdd.map((id) => ordersService.getById(id)),
      );
      const newLines = results.map((r) => {
        const o = r.data;
        const p = o?.product;
        const price = p?.sale_price != null ? Number(p.sale_price) : null;
        const delivered = o?.total_real_delivered ?? o?.total_delivered ?? 0;
        return {
          orderId: o.id,
          reference: p?.code || "-",
          description: p?.name || "Sin descripción",
          unit: price,
          deliveredQty: delivered,
          qty: String(delivered),
          editing: false,
          snap: String(delivered),
        };
      });
      setLines((prev) => [...prev, ...newLines]);
      setCheckedIds(new Set());
      toast.success(`${newLines.length} orden(es) agregada(s).`);
    } catch {
      toast.error("No se pudieron agregar las órdenes.");
    } finally {
      setAdding(false);
    }
  };

  // ── Edición de la cantidad por línea ──
  const mapLine = (idx, fn) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? fn(l) : l)));
  const startEdit = (idx) =>
    mapLine(idx, (l) => ({ ...l, editing: true, snap: l.qty }));
  const changeQty = (idx, val) =>
    mapLine(idx, (l) => {
      const digits = val.replace(/\D/g, "");
      if (digits === "") return { ...l, qty: "" };
      return { ...l, qty: String(Math.min(Number(digits), l.deliveredQty)) };
    });
  const acceptEdit = (idx) =>
    mapLine(idx, (l) => {
      const n = Number(l.qty);
      if (!l.qty || n <= 0 || n > l.deliveredQty) {
        toast.error(
          `Valor no permitido. La cantidad debe estar entre 1 y ${nf.format(l.deliveredQty)} (lo entregado).`,
        );
        return { ...l, qty: String(l.deliveredQty), editing: false };
      }
      return { ...l, editing: false };
    });
  const cancelEdit = (idx) =>
    mapLine(idx, (l) => ({ ...l, qty: l.snap, editing: false }));
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const hasAllPrices =
    lines.length > 0 && lines.every((l) => l.unit != null && l.unit > 0);
  const canPrint = lines.length >= 2 && hasAllPrices;

  const printLines = lines.map((l) => {
    const quantity = Number(l.qty) || 0;
    return { ...l, quantity, total: (l.unit ?? 0) * quantity };
  });
  const grandTotal = printLines.reduce((acc, l) => acc + l.total, 0);
  const fillerRows = Math.max(0, MIN_ROWS - printLines.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              Impresión masiva de remisión
            </h2>
            <p className="text-xs text-gray-500">
              Varias órdenes terminadas de un mismo cliente en una sola
              impresión.
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
            <>
              {/* ── Controles (no se imprimen) ── */}
              <div className="mb-5 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="max-w-sm">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Cliente
                  </label>
                  <Combobox
                    items={clients}
                    itemToStringValue={(c) => c.name}
                    value={selectedClient}
                    onValueChange={onSelectClient}
                  >
                    <ComboboxInput placeholder="Buscar cliente..." showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        No hay clientes con órdenes terminadas.
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(c) => (
                          <ComboboxItem key={c.key} value={c.key}>
                            {c.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {selectedClient && (
                  <>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="w-24 px-3 py-2 text-center font-semibold">
                              Seleccionar
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Orden
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Fecha
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Producto
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Entregadas
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientOrders.map((o) => {
                            const added = lines.some((l) => l.orderId === o.id);
                            return (
                              <tr
                                key={o.id}
                                className="border-t border-slate-100"
                              >
                                <td className="px-3 py-2 text-center">
                                  <Checkbox
                                    checked={checkedIds.has(o.id)}
                                    disabled={added}
                                    onCheckedChange={() => toggleCheck(o.id)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  #{o.id}
                                  {added && (
                                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      agregada
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {fmtShortDate(o.date)}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                  {o.product?.name || "-"}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {nf.format(
                                    o.total_real_delivered ??
                                      o.total_delivered ??
                                      0,
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {clientOrders.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-4 text-center text-slate-400"
                              >
                                Este cliente no tiene órdenes terminadas.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {checkedIds.size} seleccionada(s) · mínimo 2 para la
                        primera impresión masiva.
                      </p>
                      <Button
                        onClick={handleAgregar}
                        disabled={!canAdd || adding}
                        className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {adding ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Plus size={16} className="mr-2" />
                        )}
                        Agregar
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Documento imprimible ── */}
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
                  Selecciona un cliente y agrega al menos 2 órdenes para armar
                  la remisión.
                </div>
              ) : (
                <>
                  {!hasAllPrices && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                      <span>
                        No es posible imprimir porque alguna orden tiene un
                        producto sin precio asignado.
                      </span>
                    </div>
                  )}

                  <div
                    ref={printRef}
                    className="mx-auto w-full max-w-[720px] bg-white p-6 text-[13px] text-black"
                  >
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td
                            colSpan={5}
                            className="border border-black bg-[#9db3d4] px-2 py-2 text-center text-lg font-bold"
                          >
                            REMISIÓN
                          </td>
                        </tr>
                        <tr>
                          <td className="w-[18%] border border-black px-2 py-1 font-bold">
                            FECHA:
                          </td>
                          <td
                            colSpan={2}
                            className="border border-black px-2 py-1 text-center"
                          >
                            {fechaHoy()}
                          </td>
                          <td
                            colSpan={2}
                            className="border border-black px-2 py-1 font-bold"
                          >
                            No:{" "}
                            <span className="text-red-700">{printCode}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black px-2 py-1 font-bold">
                            NOMBRE:
                          </td>
                          <td
                            colSpan={4}
                            className="border border-black px-2 py-1 text-center font-semibold"
                          >
                            {selectedClient?.name || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="py-1"></td>
                        </tr>
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

                        {printLines.map((l, idx) => {
                          const priced = l.unit != null && l.unit > 0;
                          return (
                            <tr key={l.orderId}>
                              <td className="border border-black px-2 py-1 text-center">
                                <span className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Quitar de la remisión"
                                    onClick={() => removeLine(idx)}
                                    className="cursor-pointer text-slate-300 transition-colors hover:text-red-500 print:hidden"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  {l.reference}
                                </span>
                              </td>
                              <td className="border border-black px-2 py-1">
                                {l.description}
                              </td>
                              <td className="border border-black px-2 py-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={l.qty}
                                    disabled={!l.editing}
                                    title={`Entregadas: ${nf.format(l.deliveredQty)} (máx.)`}
                                    onChange={(e) =>
                                      changeQty(idx, e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") acceptEdit(idx);
                                      if (e.key === "Escape") cancelEdit(idx);
                                    }}
                                    className="w-16 bg-transparent text-center font-semibold text-black outline-none disabled:cursor-default disabled:opacity-100"
                                  />
                                  <span className="flex items-center gap-0.5 print:hidden">
                                    {!l.editing ? (
                                      <button
                                        type="button"
                                        title="Editar cantidad"
                                        onClick={() => startEdit(idx)}
                                        className="cursor-pointer text-slate-400 transition-colors hover:text-[#13529a]"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          title="Aceptar"
                                          onClick={() => acceptEdit(idx)}
                                          className="cursor-pointer text-green-600 transition-colors hover:text-green-700"
                                        >
                                          <Check size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          title="Cancelar edición"
                                          onClick={() => cancelEdit(idx)}
                                          className="cursor-pointer text-red-500 transition-colors hover:text-red-600"
                                        >
                                          <X size={15} />
                                        </button>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="border border-black px-2 py-1 text-right">
                                {priced ? money(l.unit) : "-"}
                              </td>
                              <td className="border border-black px-2 py-1 text-right">
                                {priced ? money(l.total) : "-"}
                              </td>
                            </tr>
                          );
                        })}

                        {Array.from({ length: fillerRows }).map((_, i) => (
                          <tr key={`filler-${i}`}>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                          </tr>
                        ))}

                        <tr>
                          <td
                            colSpan={3}
                            className="border border-black bg-[#9db3d4] px-2 py-2 text-center font-bold"
                          >
                            PROGRÁFICOS
                            <div className="mt-6 font-semibold">
                              NOMBRE Y FIRMA
                            </div>
                          </td>
                          <td className="border border-black px-2 py-1 text-center font-bold">
                            TOTAL
                          </td>
                          <td className="border border-black px-2 py-1 text-right font-bold">
                            {hasAllPrices ? money(grandTotal) : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
            disabled={loading || !canPrint}
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
