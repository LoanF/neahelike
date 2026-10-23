import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plaque } from "@/components/plaque";
import { PageIntro } from "@/components/site/section";
import { LEGAL } from "@/content/legal";
import styles from "./legal.module.css";

type Slug = keyof typeof LEGAL;

/*
 * Les trois documents sont générés au build. Une autre adresse à la racine (/n-importe-quoi, une icône demandée
 * par le navigateur…) arrive aussi ici et répond 404 avec notFound() ci-dessous. Pas de `dynamicParams = false` :
 * avec Next 15.5, il fait écrire « Error: Internal: NoFallbackError » dans la console à chaque adresse inconnue.
 */
export function generateStaticParams() {
  return Object.keys(LEGAL).map(legal => ({ legal }));
}

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await params;
  const doc = LEGAL[legal as Slug];
  return doc ? { title: doc.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  const doc = LEGAL[legal as Slug];
  if (!doc) notFound();
  const updatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(doc.updatedAt));

  return (
    <>
      <PageIntro title={doc.title} lead={doc.lead}>
        <p className={styles.updated}>Dernière mise à jour : {updatedAt}</p>
      </PageIntro>
      <div className={styles.wrap}>
        <Plaque className={styles.doc}>
          {doc.sections.map((section, i) => (
            <section key={section.title} className={styles.section}>
              <h2 className={styles.title}>{i + 1}. {section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </Plaque>
      </div>
    </>
  );
}
