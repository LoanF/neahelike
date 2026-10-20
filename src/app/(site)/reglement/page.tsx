import type { Metadata } from "next";
import { PageIntro } from "@/components/site/section";
import { RULES, RULES_DRAFT, RULES_UPDATED_AT } from "@/content/reglement";
import { RulesBook } from "./rules-book";

export const metadata: Metadata = {
  title: "Règlement",
  description: "Le règlement du serveur roleplay Néa Hélikè.",
};

const updatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(RULES_UPDATED_AT));

export default function ReglementPage() {
  return (
    <>
      <PageIntro title="Règlement" lead="Les lois de la cité, côté joueurs. Les connaître est la première condition pour y entrer.">
        <p style={{ color: "var(--nh-parchment-dim)", fontSize: 14 }}>Dernière mise à jour : {updatedAt}</p>
      </PageIntro>
      <RulesBook chapters={RULES} draft={RULES_DRAFT} />
    </>
  );
}
