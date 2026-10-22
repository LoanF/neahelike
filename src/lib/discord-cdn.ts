/** URLs du CDN Discord (utilisables côté client comme côté serveur). */
const CDN = "https://cdn.discordapp.com";

/** Discord n'accepte que les puissances de 2 de 16 à 4096 (une autre taille répond 400) : on arrondit au-dessus. */
function cdnSize(size: number) {
  return Math.min(4096, Math.max(16, 2 ** Math.ceil(Math.log2(size))));
}

export function avatarUrl(user: { id: string; avatar: string | null }, size = 128) {
  if (!user.avatar) {
    // Avatar par défaut de Discord, choisi à partir de l'ID.
    const index = Number((BigInt(user.id) >> BigInt(22)) % BigInt(6));
    return `${CDN}/embed/avatars/${index}.png`;
  }
  const ext = user.avatar.startsWith("a_") ? "gif" : "webp";
  return `${CDN}/avatars/${user.id}/${user.avatar}.${ext}?size=${cdnSize(size)}`;
}

export function bannerUrl(user: { id: string; banner: string | null }, size = 600) {
  if (!user.banner) return null;
  const ext = user.banner.startsWith("a_") ? "gif" : "webp";
  return `${CDN}/banners/${user.id}/${user.banner}.${ext}?size=${cdnSize(size)}`;
}

export function displayName(user: { username: string; globalName: string | null }) {
  return user.globalName || user.username;
}
