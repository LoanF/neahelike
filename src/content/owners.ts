/*
 * Owners permanents du site : ils restent owners quoi qu'il arrive à la base de données
 * (base neuve, réinitialisation). Les owners ajoutés depuis le site vivent dans la table `site_owners`.
 */
export const PERMANENT_OWNERS = [
  { id: "500637897066807296", label: "demonou" },
  { id: "270215118028013568", label: "SoliraZ" },
  { id: "343072136916762624", label: "Loan" },
] as const;

export const PERMANENT_OWNER_IDS: readonly string[] = PERMANENT_OWNERS.map(owner => owner.id);
