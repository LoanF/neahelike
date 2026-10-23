import "server-only";
import { getBusinesses } from "@/lib/businesses";
import { getFactions } from "@/lib/factions";
import type { Choice } from "./choice-grid";

/**
 * Listes des formulaires (affinités, créatures, reprises), lues côté serveur à chaque affichage :
 * rejoindre une affinité ou une créature fermée affiche « places closes », un lead ou une entreprise reprise « déjà repris ».
 */
export async function formChoices() {
  const [{ affinities: affinityList, creatures: creatureList }, businessList] = await Promise.all([getFactions(), getBusinesses()]);
  const affinityChoice = (item: (typeof affinityList)[number]) => ({ id: item.id, name: item.name, meta: `${item.god} · ${item.element}`, emblem: item.emblem });
  const creatureChoice = (item: (typeof creatureList)[number]) => ({ id: item.id, name: item.name, meta: item.originShort, emblem: item.emblem });
  const affinities: Choice[] = affinityList.map(item => ({ ...affinityChoice(item), closed: !item.joinOpen }));
  const creatures: Choice[] = creatureList.map(item => ({ ...creatureChoice(item), closed: !item.joinOpen }));
  const leads = {
    affinite: affinityList.map(item => ({ ...affinityChoice(item), closed: !item.leadOpen })),
    creature: creatureList.map(item => ({ ...creatureChoice(item), closed: !item.leadOpen })),
    entreprise: businessList.map(item => ({ id: item.id, name: item.name, meta: item.description, emblem: "coin" as const, closed: !item.open })),
  };
  return { affinities, creatures, leads };
}
