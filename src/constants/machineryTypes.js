export const MACHINERY_TYPE_OPTIONS = [
  { value: "PREPRENSA", label: "Preprensa" },
  { value: "GUILLOTINA", label: "Guillotina" },
  { value: "IMPRESORA_OFFSET", label: "Impresora offset" },
  { value: "IMPRESORA_DIGITAL", label: "Impresora digital" },
  { value: "PLASTIFICADORA", label: "Plastificadora" },
  { value: "LAMINADORA", label: "Laminadora" },
  { value: "BARNIZADORA", label: "Barnizadora" },
  { value: "ESTAMPADORA", label: "Estampadora" },
  { value: "TROQUELADORA", label: "Troqueladora" },
  { value: "PEGADORA", label: "Pegadora" },
  { value: "DOBLADORA", label: "Dobladora" },
  { value: "EMPAQUE", label: "Empaque" },
  { value: "OTRA", label: "Otra" },
];

export const getMachineryTypeLabel = (value) =>
  MACHINERY_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
  value ||
  "-";
