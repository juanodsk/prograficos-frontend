// Chequeo de permisos (claims) en el frontend.
// ADMIN es superusuario: siempre pasa.
export const hasPermission = (user, key) =>
  user?.role === "ADMIN" || (user?.permissions || []).includes(key);

// Basta con tener uno de los permisos indicados.
export const hasAnyPermission = (user, ...keys) =>
  user?.role === "ADMIN" || keys.some((k) => (user?.permissions || []).includes(k));
