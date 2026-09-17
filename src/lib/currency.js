// Formatea un valor a pesos colombianos (COP), sin decimales y con punto de
// miles: 15000 -> "$15.000". Devuelve "Sin precio" si no hay valor.
export const formatCOP = (value) => {
  if (value === null || value === undefined || value === "") return "Sin precio";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Sin precio";
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount)}`;
};
