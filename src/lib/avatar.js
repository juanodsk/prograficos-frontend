export const resolveAvatarUrl = (user) => {
  // Prioridad: foto en R2 (URL firmada) — no se le agrega nada para no invalidar
  // la firma; cada subida genera una key nueva, así que la URL ya cambia sola.
  if (user?.avatar_url) {
    return user.avatar_url;
  }

  if (!user?.avatar) {
    return null;
  }

  const separator = user.avatar.includes("?") ? "&" : "?";
  const version = user.avatarVersion || 0;

  return `${user.avatar}${separator}v=${version}`;
};
