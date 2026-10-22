import { describe, expect, it, vi } from "vitest";
import type { Application } from "@/db/schema";

// Auth.js lit sa configuration à l'import : ces règles n'en ont pas besoin.
vi.mock("@/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));

const { hasRank } = await import("@/lib/session");
const { canDeleteNote, readableVisibilities, teamBadge } = await import("@/lib/team");
const { reapplyDate, startBlock } = await import("@/lib/applications");
const { slugify } = await import("@/lib/admin");

function application(overrides: Partial<Application> = {}): Application {
  return {
    id: "a1",
    userId: "1",
    status: "brouillon",
    hrp: null,
    rp: null,
    background: null,
    dossier: null,
    changesSteps: null,
    viewedAt: null,
    submittedAt: null,
    decidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Application;
}

describe("rangs", () => {
  it("donne à chaque rang les droits des rangs inférieurs", () => {
    expect(hasRank({ rank: "owner" }, "admin")).toBe(true);
    expect(hasRank({ rank: "admin" }, "recruteur")).toBe(true);
    expect(hasRank({ rank: "recruteur" }, "admin")).toBe(false);
    expect(hasRank({ rank: "joueur" }, "recruteur")).toBe(false);
    expect(hasRank({ rank: "joueur" }, "joueur")).toBe(true);
  });
});

describe("notes internes", () => {
  it("cache les notes réservées aux admins aux recruteurs", () => {
    expect(readableVisibilities({ rank: "recruteur" })).toEqual(["equipe"]);
    expect(readableVisibilities({ rank: "admin" })).toEqual(["equipe", "admin"]);
    expect(readableVisibilities({ rank: "owner" })).toEqual(["equipe", "admin"]);
  });

  it("laisse un recruteur supprimer seulement ses propres notes", () => {
    expect(canDeleteNote({ authorId: "r1" }, { id: "r1", rank: "recruteur" })).toBe(true);
    expect(canDeleteNote({ authorId: "r2" }, { id: "r1", rank: "recruteur" })).toBe(false);
    expect(canDeleteNote({ authorId: "r2" }, { id: "a1", rank: "admin" })).toBe(true);
  });
});

describe("badge de la liste des joueurs", () => {
  it("distingue les candidatures lues et à lire", () => {
    expect(teamBadge(null)).toBe("aucune");
    expect(teamBadge(application({ status: "envoyee" }))).toBe("a_lire");
    expect(teamBadge(application({ status: "envoyee", viewedAt: new Date() }))).toBe("vue");
    expect(teamBadge(application({ status: "refusee" }))).toBe("refusee");
  });

  it("signale un brouillon dont le dossier de reprise manque", () => {
    const hrp = { age: "24", rpHours: "10", experience: "Dix heures de RP.", goodMic: true, wantsDossier: true };
    expect(teamBadge(application({ hrp }))).toBe("dossier");
    expect(teamBadge(application({ hrp: { ...hrp, wantsDossier: false } }))).toBe("brouillon");
  });
});

describe("délai de recandidature", () => {
  it("bloque trois mois après un refus", () => {
    const decidedAt = new Date();
    const until = reapplyDate({ decidedAt });
    expect(until?.getMonth()).toBe(new Date(new Date(decidedAt).setMonth(decidedAt.getMonth() + 3)).getMonth());
    expect(startBlock(application({ status: "refusee", decidedAt }))).toEqual({ reason: "delai", until });
  });

  it("laisse recandidater une fois le délai passé", () => {
    const decidedAt = new Date();
    decidedAt.setMonth(decidedAt.getMonth() - 4);
    expect(startBlock(application({ status: "refusee", decidedAt }))).toBeNull();
  });

  it("empêche un joueur whitelisté de recommencer", () => {
    expect(startBlock(application({ status: "whitelistee" }))).toEqual({ reason: "whitelistee" });
    expect(startBlock(null)).toBeNull();
  });
});

describe("identifiants de l'administration", () => {
  it("transforme un nom en identifiant lisible", () => {
    expect(slugify("Les Harpies")).toBe("les-harpies");
    expect(slugify("  La Forge d'Héphaïstos ! ")).toBe("la-forge-d-hephaistos");
  });
});
