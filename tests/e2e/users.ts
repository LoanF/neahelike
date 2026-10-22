/** Comptes et adresses partagés par les tests de bout en bout. */
export const E2E_PORT = 3100;
export const BASE_URL = `http://localhost:${E2E_PORT}`;

/** Rôles Discord fictifs qui donnent les rangs recruteur et admin dans la base de test. */
export const RECRUITER_ROLE = "900000000000000099";
export const ADMIN_ROLE = "900000000000000098";

export const PLAYER = { id: "900000000000000001", username: "e2e-joueur", rank: "joueur" } as const;
export const RECRUITER = { id: "900000000000000002", username: "e2e-recruteur", rank: "recruteur" } as const;
export const ADMIN = { id: "900000000000000003", username: "e2e-admin", rank: "admin" } as const;
/** Joueur déjà whitelist, pour le retrait de whitelist et la blacklist. */
export const WHITELISTED = { id: "900000000000000004", username: "e2e-whitelist", rank: "joueur" } as const;
/** Joueur blacklisté par le bot avant sa première connexion au site. */
export const BOT_BLACKLISTED = { id: "900000000000000005", username: "e2e-blacklist-bot", rank: "joueur" } as const;

export const USERS = [PLAYER, RECRUITER, ADMIN, WHITELISTED, BOT_BLACKLISTED];

export function stateFile(user: { username: string }) {
  return `tests/e2e/.auth/${user.username}.json`;
}
