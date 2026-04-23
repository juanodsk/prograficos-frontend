const sizePrefixMap = {
  SMALL: "S",
  MEDIUM: "M",
  LARGE: "L",
};

export const formatTroquelCode = (troquel) => {
  if (!troquel) return "";

  const rawCode = String(
    troquel.code ?? troquel.name ?? troquel.troquel_code ?? "",
  ).trim();

  if (!rawCode) return "";

  const prefix = sizePrefixMap[troquel.size] || "";

  if (!prefix) return rawCode;
  if (rawCode.toUpperCase().startsWith(prefix)) return rawCode;

  return `${prefix}${rawCode}`;
};

export const formatTroquelLabel = (
  troquel,
  fallback = "Troquel sin código",
) => {
  if (!troquel) return fallback;
  return formatTroquelCode(troquel) || troquel.file_name || `Troquel #${troquel.id}`;
};
