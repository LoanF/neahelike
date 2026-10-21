import Link from "next/link";
import { ButtonLink, DotsRow, Logo, Plaque, Rivet, Scene, Socket, Spiral } from "@/components/plaque";
import { Section, SectionHead } from "@/components/site/section";
import { AFFINITIES } from "@/content/lore";
import { SITE } from "@/content/site";
import { CreaturesShowcase } from "./creatures-showcase";
import styles from "./home.module.css";

const FACTS = [
  { k: "Accès", v: "Whitelist" },
  { k: "Univers", v: "Grèce antique, 360 av. J.-C." },
  { k: "Âge minimum", v: "18 ans" },
  { k: "Langue", v: "Français" },
];

const STEPS = [
  { n: "I", t: "Discord", d: "Connecte ton compte Discord au portail et accepte les CGU." },
  { n: "II", t: "Candidature", d: "Infos HRP, personnage, affinité et background. Ton brouillon est gardé." },
  { n: "III", t: "Vocal", d: "Un recruteur te reçoit sur Discord pour un court entretien." },
  { n: "IV", t: "Citoyen", d: "Tu es whitelisté. Ton personnage entre dans la cité." },
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <Scene className={styles.heroArt} caption="Key art : la cité sortant des flots au crépuscule, hoplite et prêtresse au premier plan" />
        <div className={styles.heroVeil} aria-hidden="true" />
        <div className={styles.heroContent}>
          <Logo size={104} ring={3} />
          <div className={styles.heroTitleRow}>
            <h1 className={styles.heroTitle}>Néa Hélikè</h1>
            <Spiral />
          </div>
          <p className={styles.heroLead}>La cité engloutie est sortie des eaux. Les dieux sont revenus avec elle. Choisis ta place.</p>
          <div className={styles.heroActions}>
            <ButtonLink href={SITE.joinUrl} size="lg">Rejoindre la Whitelist</ButtonLink>
            <ButtonLink href="/lore" variant="secondary" size="lg">Découvrir le lore</ButtonLink>
            <a href={SITE.discordUrl} target="_blank" rel="noreferrer" className={styles.heroDiscord}>Rejoindre le Discord</a>
          </div>
        </div>
      </section>

      <Section first>
        <Plaque className={styles.server}>
          <div className={styles.serverText}>
            <DotsRow width={220} />
            <h2 className={styles.serverTitle}>Le serveur</h2>
            <p className={styles.lead}>
              Néa Hélikè est un serveur roleplay FiveM en whitelist. En 373 av. J.-C., la cité grecque d&apos;Hélikè est engloutie par la mer. Ses survivants fondent
              Néa Hélikè, la « Nouvelle Hélikè ». Douze ans plus tard, la cité grandit vite, ses habitants portent la marque des dieux, et les créatures des mythes
              vivent parmi eux.
            </p>
            <p className={styles.leadDim}>On attend un RP sérieux, écrit et suivi. Chaque personnage passe par une candidature et un entretien vocal.</p>
          </div>
          <dl className={styles.facts}>
            {FACTS.map(fact => (
              <div key={fact.k} className={styles.fact}>
                <dt>{fact.k}</dt>
                <dd>{fact.v}</dd>
              </div>
            ))}
          </dl>
        </Plaque>
      </Section>

      <Section>
        <SectionHead
          title="Les Affinités"
          sub="Quatre dieux marquent les mortels. Les Guerriers n'ont aucun pouvoir, seulement leur force."
          link={{ href: "/lore#affinites", label: "Toutes les fiches dans le lore" }}
        />
        <div className={styles.affinities}>
          {AFFINITIES.map(affinity => (
            <Link key={affinity.id} href={`/lore#affinites-${affinity.id}`} className={styles.affinityLink}>
              <Plaque rivets="none" interactive className={styles.affinity}>
                <Socket className={styles.affinityArt}>
                  <Scene className={styles.fill} caption={affinity.art} />
                  <span className={styles.element}>{affinity.element}</span>
                </Socket>
                <div className={styles.affinityBody}>
                  <span className={styles.affinityName}>{affinity.name}</span>
                  <span className={styles.affinityGod}>{affinity.god}</span>
                  <p className={styles.affinityText}>{affinity.hook}</p>
                </div>
              </Plaque>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead title="Les Créatures" sub="Places limitées, candidature dédiée. Choisis une créature pour voir sa fiche." />
        <CreaturesShowcase />
      </Section>

      <Section>
        <SectionHead title="Comment rejoindre" sub="Quatre étapes, compte entre 48 et 72 heures." />
        <ol className={styles.steps}>
          {STEPS.map(step => (
            <li key={step.n}>
              <Plaque rivets="none" className={styles.step}>
                <Rivet side="right" />
                <Socket className={styles.stepNumber}>{step.n}</Socket>
                <span className={styles.stepTitle}>{step.t}</span>
                <p>{step.d}</p>
              </Plaque>
            </li>
          ))}
        </ol>
        <div className={styles.cta}>
          <span>Tout commence avec ton compte Discord.</span>
          <ButtonLink href={SITE.joinUrl} size="lg">Rejoindre la Whitelist</ButtonLink>
        </div>
      </Section>
    </>
  );
}
