import { describe, expect, it } from "vitest";
import {
  canAccessStep,
  currentStep,
  dossierTargetLabel,
  isStepEditable,
  nextStep,
  parseStep,
  previousStep,
  visibleSteps,
} from "@/lib/application";

// Valeurs telles qu'enregistrées par le formulaire : des chaînes et des cases.
const HRP = { age: "24", rpHours: "300", experience: "Deux ans de RP whitelist.", goodMic: true, wantsDossier: false };
const RP = { firstName: "Eudoxie", lastName: "Lykaina", age: "30", origin: "Née au-dessus du port.", affinity: "", creature: "harpies" };
const BACKGROUND = { url: "https://docs.google.com/document/d/x", shared: true };
const DOSSIER = { kind: "entreprise", target: "nouvelle", targetName: "Les bains d'Asclépios", url: "https://www.canva.com/design/x", shared: true };

type Draft = NonNullable<Parameters<typeof currentStep>[0]>;

function application(overrides: Partial<Draft> = {}): Draft {
  return { hrp: null, rp: null, background: null, dossier: null, status: "brouillon", changesSteps: null, ...overrides };
}

describe("validation des étapes", () => {
  it("accepte une étape HRP complète et convertit les nombres", () => {
    const result = parseStep("hrp", HRP);
    expect(result.success).toBe(true);
    expect(result.data?.age).toBe(24);
  });

  it("refuse un joueur de moins de 18 ans", () => {
    const result = parseStep("hrp", { ...HRP, age: "17" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["age"]);
  });

  it("refuse un personnage de moins de 18 ans", () => {
    expect(parseStep("rp", { ...RP, age: "17" }).success).toBe(false);
    expect(parseStep("rp", RP).success).toBe(true);
  });

  it("signale un champ jamais rempli comme obligatoire", () => {
    const result = parseStep("rp", { ...RP, firstName: null });
    expect(result.error?.issues[0].message).toBe("Ce champ est obligatoire.");
  });

  it("n'accepte que des liens https et un document partagé", () => {
    expect(parseStep("background", { ...BACKGROUND, url: "http://docs.google.com/x" }).success).toBe(false);
    expect(parseStep("background", { ...BACKGROUND, url: "pas un lien" }).success).toBe(false);
    expect(parseStep("background", { ...BACKGROUND, shared: false }).success).toBe(false);
    expect(parseStep("background", BACKGROUND).success).toBe(true);
  });

  it("refuse un identifiant d'affinité qui n'a pas la forme attendue", () => {
    expect(parseStep("rp", { ...RP, affinity: "<script>" }).success).toBe(false);
  });

  it("demande le nom d'une nouvelle entreprise", () => {
    const result = parseStep("dossier", { ...DOSSIER, targetName: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["targetName"]);
    expect(parseStep("dossier", DOSSIER).success).toBe(true);
  });

  it("réserve « nouvelle » aux entreprises", () => {
    expect(parseStep("dossier", { ...DOSSIER, kind: "creature" }).success).toBe(false);
  });
});

describe("parcours de la candidature", () => {
  it("commence par l'étape HRP", () => {
    expect(currentStep(application())).toBe("hrp");
    expect(canAccessStep(application(), "rp")).toBe(false);
  });

  it("avance étape par étape et finit sur le récapitulatif", () => {
    const draft = application({ hrp: HRP, rp: RP });
    expect(currentStep(draft)).toBe("background");
    expect(canAccessStep(draft, "background")).toBe(true);
    expect(canAccessStep(draft, "recapitulatif")).toBe(false);
    expect(currentStep(application({ hrp: HRP, rp: RP, background: BACKGROUND }))).toBe("recapitulatif");
  });

  it("n'affiche le dossier de reprise que si la case est cochée", () => {
    expect(visibleSteps(application({ hrp: HRP })).map(step => step.id)).not.toContain("dossier");
    const withDossier = application({ hrp: { ...HRP, wantsDossier: true }, rp: RP, background: BACKGROUND });
    expect(visibleSteps(withDossier).map(step => step.id)).toContain("dossier");
    expect(currentStep(withDossier)).toBe("dossier");
    expect(nextStep(withDossier, "background")).toBe("dossier");
  });

  it("donne l'étape précédente, et aucune avant la première", () => {
    const draft = application({ hrp: HRP, rp: RP });
    expect(previousStep(draft, "rp")).toBe("hrp");
    expect(previousStep(draft, "hrp")).toBeNull();
  });
});

describe("demande de modification", () => {
  const complete = { hrp: HRP, rp: RP, background: BACKGROUND, status: "a_modifier" as const };

  it("ne rouvre que les étapes choisies par l'équipe", () => {
    const draft = application({ ...complete, changesSteps: ["background"] });
    expect(isStepEditable(draft, "background")).toBe(true);
    expect(isStepEditable(draft, "hrp")).toBe(false);
    expect(canAccessStep(draft, "hrp")).toBe(false);
    expect(currentStep(draft)).toBe("background");
    expect(nextStep(draft, "background")).toBe("recapitulatif");
  });

  it("ouvre le dossier ajouté pendant la modification tant qu'il n'est pas rempli", () => {
    const draft = application({ ...complete, hrp: { ...HRP, wantsDossier: true }, changesSteps: ["hrp"] });
    expect(isStepEditable(draft, "dossier")).toBe(true);
    expect(isStepEditable({ ...draft, dossier: DOSSIER }, "dossier")).toBe(false);
  });
});

describe("libellé du dossier de reprise", () => {
  const names = { harpies: "Harpies", forge: "La Forge d'Héphaïstos" };

  it("nomme le lead d'une créature ou d'une affinité", () => {
    expect(dossierTargetLabel({ kind: "creature", target: "harpies" }, names)).toBe("Lead des Harpies");
  });

  it("nomme une entreprise existante ou nouvelle", () => {
    expect(dossierTargetLabel({ kind: "entreprise", target: "forge" }, names)).toBe("Entreprise : La Forge d'Héphaïstos");
    expect(dossierTargetLabel(DOSSIER, names)).toBe("Nouvelle entreprise : Les bains d'Asclépios");
  });

  it("ne renvoie rien tant que la cible n'est pas choisie", () => {
    expect(dossierTargetLabel(null)).toBeNull();
    expect(dossierTargetLabel({ kind: "entreprise", target: "" })).toBeNull();
    expect(dossierTargetLabel({ kind: "entreprise", target: "nouvelle", targetName: "  " })).toBeNull();
  });
});
