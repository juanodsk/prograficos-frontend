import { calculateOffsetQuotation } from "@/lib/quotationCosting";
import OffsetItemFields from "./OffsetItemFields";

// Adapter de costeo de la LÍNEA OFFSET. Reúne TODA la lógica específica de
// Offset (forma del ítem, cálculo, validación, payload) + su componente de
// campos. El QuotationForm solo orquesta; para agregar otra línea (Cartón) se
// crea otro adapter con la misma interfaz y se registra en ../index.js.

const num = (v) => (v === "" || v == null ? 0 : Number(v));

const emptyCostos = () => ({
  diseno: "0",
  troquel: "0",
  acabados: "0",
  corte: "0",
  pegado: "0",
  troqueladoMillar: "0",
  plastificadoMillar: "0",
});

const emptyItem = () => ({
  descripcionProducto: "",
  cantidad: "",
  cavidad: "1",
  tintas: "1",
  paperTypeId: "",
  supplierThirdId: "",
  formatId: "",
  measureId: "",
  porcentajeGanancia: "",
  costos: emptyCostos(),
});

// Precarga un ítem a partir del documento guardado (modo editar).
const prefillItem = (it) => {
  const sub = it.costing?.subtotalCostos || 0;
  const total = it.costing?.totalCotizar || 0;
  // El % de ganancia no se persiste: se deriva del costing congelado.
  const pct = sub > 0 ? Math.round(((total - sub) / sub) * 100) : "";
  return {
    descripcionProducto: it.descripcionProducto || "",
    cantidad: String(it.cantidad ?? ""),
    cavidad: String(it.cavidad ?? "1"),
    tintas: String(it.tintas ?? "1"),
    paperTypeId: it.papel?.paperTypeId ? String(it.papel.paperTypeId) : "",
    supplierThirdId: it.papel?.supplierThirdId
      ? String(it.papel.supplierThirdId)
      : "",
    formatId: it.formato?.formatId ? String(it.formato.formatId) : "",
    measureId: it.medida?.measureId ? String(it.medida.measureId) : "",
    porcentajeGanancia: String(pct),
    costos: {
      diseno: String(it.costosManuales?.diseno ?? 0),
      troquel: String(it.costosManuales?.troquel ?? 0),
      acabados: String(it.costosManuales?.acabados ?? 0),
      corte: String(it.costosManuales?.corte ?? 0),
      pegado: String(it.costosManuales?.pegado ?? 0),
      troqueladoMillar: String(it.costosManuales?.troqueladoMillar ?? 0),
      plastificadoMillar: String(it.costosManuales?.plastificadoMillar ?? 0),
    },
  };
};

// Cálculo en vivo de un ítem. Devuelve el costing o null si faltan datos.
const computeCosting = (item, { formats, papers }) => {
  const format = formats.find((f) => String(f.id) === item.formatId);
  const paper = papers.find((p) => String(p.id) === item.paperTypeId);
  const supplier = paper?.suppliers?.find(
    (s) => String(s.third_id) === item.supplierThirdId,
  );
  const precioPapel = supplier ? Number(supplier.purchase_price) : null;
  if (!format || precioPapel == null) return null;
  return calculateOffsetQuotation({
    cantidad: num(item.cantidad),
    divisiones: format.sheet_divisions,
    cavidad: num(item.cavidad),
    precioPapel,
    tintas: num(item.tintas),
    porcentajeGanancia: num(item.porcentajeGanancia),
    costos: item.costos,
  });
};

// ── Validación ──
const costosSum = (it) =>
  Object.values(it.costos || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
const someCostoEmpty = (it) =>
  Object.values(it.costos || {}).some((v) => v === "" || v == null);
const costosInvalid = (it) => someCostoEmpty(it) || costosSum(it) <= 0;

const fieldErrors = (it) => {
  const e = {};
  if (!it.descripcionProducto.trim()) e.descripcionProducto = "Obligatorio";
  if (!it.paperTypeId) e.paperTypeId = "Selecciona un papel";
  if (!it.supplierThirdId) e.supplierThirdId = "Selecciona el proveedor";
  if (!it.formatId) e.formatId = "Selecciona un formato";
  if (!it.measureId) e.measureId = "Selecciona un tamaño";
  const cavidad = Number(it.cavidad);
  if (!Number.isInteger(cavidad) || cavidad < 1) e.cavidad = "Inválida";
  const tintas = Number(it.tintas);
  if (!Number.isInteger(tintas) || tintas < 0 || tintas > 4)
    e.tintas = "De 0 a 4 (0 = sin impresión)";
  const cantidad = Number(it.cantidad);
  if (!Number.isFinite(cantidad) || cantidad < 200)
    e.cantidad = "Mínimo 200 unidades";
  const pct = Number(it.porcentajeGanancia);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100)
    e.porcentajeGanancia = "Entre 1% y 100%";
  return e;
};

const isItemValid = (it) =>
  Object.keys(fieldErrors(it)).length === 0 && !costosInvalid(it);

// Mapea el ítem al payload que espera el backend.
const toPayloadItem = (it) => ({
  descripcionProducto: it.descripcionProducto.trim(),
  cantidad: num(it.cantidad),
  cavidad: num(it.cavidad),
  tintas: num(it.tintas),
  paperTypeId: Number(it.paperTypeId),
  supplierThirdId: Number(it.supplierThirdId),
  formatId: Number(it.formatId),
  measureId: it.measureId ? Number(it.measureId) : null,
  porcentajeGanancia: num(it.porcentajeGanancia),
  costos: {
    diseno: num(it.costos.diseno),
    troquel: num(it.costos.troquel),
    acabados: num(it.costos.acabados),
    corte: num(it.costos.corte),
    pegado: num(it.costos.pegado),
    troqueladoMillar: num(it.costos.troqueladoMillar),
    plastificadoMillar: num(it.costos.plastificadoMillar),
  },
});

// Total de la línea a cobrar al cliente = valor unitario × cantidad.
const lineTotal = (it, costing) =>
  costing ? costing.valorUnitario * (Number(it.cantidad) || 0) : 0;

const offsetAdapter = {
  label: "Offset",
  Fields: OffsetItemFields,
  emptyItem,
  prefillItem,
  computeCosting,
  fieldErrors,
  costosInvalid,
  isItemValid,
  toPayloadItem,
  lineTotal,
};

export default offsetAdapter;
