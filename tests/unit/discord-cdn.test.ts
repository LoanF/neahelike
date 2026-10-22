import { describe, expect, it } from "vitest";
import { avatarUrl, bannerUrl } from "@/lib/discord-cdn";

describe("images du CDN Discord", () => {
  it("arrondit la taille à une puissance de 2, seule acceptée par Discord", () => {
    expect(bannerUrl({ id: "1", banner: "a_abc" }, 960)).toBe("https://cdn.discordapp.com/banners/1/a_abc.gif?size=1024");
    expect(bannerUrl({ id: "1", banner: "abc" })).toBe("https://cdn.discordapp.com/banners/1/abc.webp?size=1024");
    expect(avatarUrl({ id: "1", avatar: "abc" }, 64)).toBe("https://cdn.discordapp.com/avatars/1/abc.webp?size=64");
    expect(avatarUrl({ id: "1", avatar: "abc" }, 5000)).toContain("size=4096");
  });

  it("ne renvoie pas de bannière quand le joueur n'en a pas", () => {
    expect(bannerUrl({ id: "1", banner: null })).toBeNull();
  });
});
