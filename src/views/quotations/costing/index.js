import offsetAdapter from "./offset/offsetAdapter";

// Registro de módulos de costeo por línea de servicio (patrón strategy).
// La clave es el NOMBRE de la línea tal como está en la BD.
// Para una línea nueva (p. ej. Cartón Microcorrugado) se crea su adapter con la
// misma interfaz y se agrega aquí; el QuotationForm no cambia.
const COSTING_MODULES = {
  Offset: offsetAdapter,
};

// Devuelve el adapter de costeo de la línea, o null si aún no está definido
// (en ese caso el formulario muestra "Sección de costeo en construcción").
export const getCostingModule = (lineName) =>
  COSTING_MODULES[lineName] || null;
