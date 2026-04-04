export const THIRD_TYPE_OPTIONS = [
  { value: "CLIENTE", label: "Cliente" },
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "OTROS", label: "Otros" },
];

export const PERSON_TYPE_OPTIONS = [
  { value: "NATURAL", label: "Natural" },
  { value: "JURIDICA", label: "Juridica" },
];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "NIT", label: "NIT" },
  { value: "CC", label: "Cedula de ciudadania" },
  { value: "CE", label: "Cedula de extranjeria" },
  { value: "PASAPORTE", label: "Pasaporte" },
];

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || "-";

export const getThirdTypeLabel = (value) =>
  getOptionLabel(THIRD_TYPE_OPTIONS, value);

export const getPersonTypeLabel = (value) =>
  getOptionLabel(PERSON_TYPE_OPTIONS, value);

export const getDocumentTypeLabel = (value) =>
  getOptionLabel(DOCUMENT_TYPE_OPTIONS, value);
