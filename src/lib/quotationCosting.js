// Espejo (frontend) del motor de costeo Offset del backend
// (prograficos-backend/src/modules/quotations/quotation.costing.js).
// Sirve SOLO para el cálculo en vivo del formulario. La fuente de verdad al
// guardar es el backend; si cambia la fórmula allá, actualizar aquí también.

export const PRECIO_PLANCHA = 25000;
const IMPRESION_BASE_FORMATO_GRANDE = 40000; // 1 pliego y 1/2 pliego
const IMPRESION_BASE_FORMATO_PEQUENO = 30000; // 1/4 y menores

const roundCOP = (value) => Math.round(value);

// Millares = pasadas por la máquina (cantidad/cavidad) al millar más cercano.
export const resolveMillaresOffset = (cantidad, cavidad = 1) =>
  Math.max(1, Math.round(Number(cantidad) / (Number(cavidad) || 1) / 1000));

export const resolveImpresionBase = (divisiones) =>
  Number(divisiones) <= 2
    ? IMPRESION_BASE_FORMATO_GRANDE
    : IMPRESION_BASE_FORMATO_PEQUENO;

const sumCostosFijos = (costos = {}) =>
  [costos.diseno, costos.troquel, costos.acabados, costos.corte, costos.pegado].reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );

// Devuelve el desglose, o null si faltan datos mínimos para calcular.
export const calculateOffsetQuotation = (input = {}) => {
  const cantidad = Number(input.cantidad);
  const divisiones = Number(input.divisiones);
  const cavidad = Number(input.cavidad);
  const precioPapel = Number(input.precioPapel);
  const tintas = Number(input.tintas);
  const porcentajeGanancia = Number(input.porcentajeGanancia);

  if (
    !Number.isFinite(cantidad) ||
    cantidad <= 0 ||
    !Number.isInteger(divisiones) ||
    divisiones <= 0 ||
    !Number.isInteger(cavidad) ||
    cavidad <= 0 ||
    !Number.isFinite(precioPapel) ||
    precioPapel < 0 ||
    !Number.isInteger(tintas) ||
    tintas < 0 ||
    tintas > 4 ||
    !Number.isFinite(porcentajeGanancia) ||
    porcentajeGanancia < 0
  ) {
    return null;
  }

  const unidadesPorPliego = divisiones * cavidad;
  const pliegosExactos = cantidad / unidadesPorPliego;
  const pliegos = Math.ceil(pliegosExactos);
  // El papel se cuesta sobre la fracción exacta de pliegos (no el entero).
  const precioPliegosRaw = pliegosExactos * precioPapel;
  const precioPliegos = roundCOP(precioPliegosRaw);

  const millares = resolveMillaresOffset(cantidad, cavidad);
  const baseImpresion = resolveImpresionBase(divisiones);
  const precioImpresion = roundCOP(baseImpresion * tintas * millares);
  const precioPlanchas = roundCOP(tintas * PRECIO_PLANCHA);

  const costos = input.costos || {};
  const costosFijos = roundCOP(sumCostosFijos(costos));
  const troquelado = roundCOP((Number(costos.troqueladoMillar) || 0) * millares);
  const plastificado = roundCOP(
    (Number(costos.plastificadoMillar) || 0) * millares,
  );
  const costosManuales = costosFijos + troquelado + plastificado;

  const subtotalRaw =
    precioPliegosRaw + precioPlanchas + precioImpresion + costosManuales;
  const subtotalCostos = roundCOP(subtotalRaw);
  const ganancia = roundCOP(subtotalRaw * (porcentajeGanancia / 100));
  const totalCotizar = subtotalCostos + ganancia;
  const valorUnitario = roundCOP(totalCotizar / cantidad);

  return {
    unidadesPorPliego,
    pliegos,
    millares,
    baseImpresion,
    precioPliegos,
    precioPlanchas,
    precioImpresion,
    costosFijos,
    troquelado,
    plastificado,
    costosManuales,
    subtotalCostos,
    ganancia,
    totalCotizar,
    valorUnitario,
  };
};
