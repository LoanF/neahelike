import { describe, expect, it } from "vitest";
import { formatWlSlot, parseWlSlot } from "@/lib/wl-session";

const NOW = new Date("2026-10-20T12:00:00Z");

describe("créneau de session de whitelist", () => {
  it("lit l'heure de Paris, en heure d'été comme en heure d'hiver", () => {
    const summer = parseWlSlot("2026-10-24", "21:00", "23:00", NOW);
    expect(summer).toEqual({ start: new Date("2026-10-24T19:00:00Z"), end: new Date("2026-10-24T21:00:00Z") });
    const winter = parseWlSlot("2026-11-07", "21:00", "23:30", NOW);
    expect(winter).toEqual({ start: new Date("2026-11-07T20:00:00Z"), end: new Date("2026-11-07T22:30:00Z") });
  });

  it("refuse une saisie incomplète, une fin avant le début ou une date passée", () => {
    expect(parseWlSlot("", "21:00", "23:00", NOW)).toHaveProperty("error");
    expect(parseWlSlot("2026-10-24", "23:00", "21:00", NOW)).toHaveProperty("error");
    expect(parseWlSlot("2026-10-01", "21:00", "23:00", NOW)).toHaveProperty("error");
    expect(parseWlSlot("2026-13-01", "21:00", "23:00", NOW)).toHaveProperty("error");
  });

  it("s'affiche en français, à l'heure de Paris", () => {
    const slot = parseWlSlot("2026-10-24", "21:00", "23:00", NOW);
    if ("error" in slot) throw new Error(slot.error);
    expect(formatWlSlot(slot)).toBe("samedi 24 octobre, de 21 h 00 à 23 h 00");
  });
});
