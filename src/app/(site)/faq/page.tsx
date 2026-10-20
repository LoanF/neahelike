import type { Metadata } from "next";
import { Accordion } from "@/components/arc/accordion/accordion";
import { ButtonLink, Plaque } from "@/components/plaque";
import { PageIntro } from "@/components/site/section";
import { FAQ } from "@/content/faq";
import { SITE } from "@/content/site";
import styles from "./faq.module.css";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Les questions fréquentes sur la whitelist et le serveur Néa Hélikè.",
};

export default function FaqPage() {
  return (
    <>
      <PageIntro title="FAQ" lead="Les questions qu'on nous pose le plus. Tu ne trouves pas ta réponse ? Pose-la sur le Discord." />
      <div className={styles.wrap}>
        {FAQ.map((group, i) => (
          <Plaque as="section" key={group.title} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <Accordion items={group.items} size="lg" defaultOpen={i === 0 ? 0 : -1} />
          </Plaque>
        ))}
        <div className={styles.cta}>
          <span>Une autre question ?</span>
          <div className={styles.ctaActions}>
            <a href={SITE.discordUrl} target="_blank" rel="noreferrer" className={styles.discord}>Poser la question sur Discord</a>
            <ButtonLink href={SITE.joinUrl} size="lg">Rejoindre la Whitelist</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
