export const resolveAvatarUrl = (user) => {
  if (!user?.avatar) {
    return null;
  }

  const separator = user.avatar.includes("?") ? "&" : "?";
  const version = user.avatarVersion || 0;

  return `${user.avatar}${separator}v=${version}`;
};
