import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatars et bannières Discord.
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
  async headers() {
    // Tant que le site n'est pas ouvert, aucune réponse (pages, images, fichiers) n'est indexable.
    if (process.env.NEXT_PUBLIC_INDEXABLE === "true") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
