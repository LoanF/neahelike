/** Comptes et adresses partagés par les tests de bout en bout. */
export const E2E_PORT = 3100;
export const BASE_URL = `http://localhost:${E2E_PORT}`;

/** Rôle Discord fictif qui donne le rang recruteur dans la base de test. */
export const RECRUITER_ROLE = "900000000000000099";

export const PLAYER = { id: "900000000000000001", username: "e2e-joueur", rank: "joueur" } as const;
export const RECRUITER = { id: "900000000000000002", username: "e2e-recruteur", rank: "recruteur" } as const;

export function stateFile(user: { username: string }) {
  return `tests/e2e/.auth/${user.username}.json`;
}
