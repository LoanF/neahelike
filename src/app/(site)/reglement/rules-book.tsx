"use client";

import { useMemo, useState } from "react";
import { Plaque } from "@/components/plaque";
import type { RuleChapter } from "@/content/reglement";
import styles from "./reglement.module.css";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Règlement : sommaire latéral fixe, recherche sans accents, articles numérotés « chapitre.article ». */
export function RulesBook({ chapters, draft }: { chapters: RuleChapter[]; draft: boolean }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return chapters
      .map((chapter, c) => ({
        ...chapter,
        number: c + 1,
        articles: chapter.articles
          .map((article, a) => ({ ...article, number: `${c + 1}.${a + 1}` }))
          .filter(article => !q || normalize(`${article.title} ${article.text} ${chapter.title}`).includes(q)),
      }))
      .filter(chapter => chapter.articles.length > 0);
  }, [chapters, query]);

  return (
    <div className={styles.layout}>
      <aside className={styles.aside}>
        <label className={styles.searchLabel} htmlFor="nh-rules-search">Rechercher</label>
        <input
          id="nh-rules-search"
          type="search"
          className={styles.search}
          placeholder="Métagaming, micro, sanctions…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <nav className={styles.toc} aria-label="Sommaire du règlement">
          {filtered.map(chapter => (
            <a key={chapter.id} href={`#${chapter.id}`} className={styles.tocLink}>
              <span className={styles.tocNumber}>{chapter.number}</span>
              {chapter.title}
            </a>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        {draft && (
          <p className={styles.draft} role="note">
            Règlement provisoire : la version officielle de l&apos;équipe arrive bientôt.
          </p>
        )}
        {filtered.length === 0 && <p className={styles.empty}>Aucun article ne correspond à « {query} ».</p>}
        {filtered.map(chapter => (
          <Plaque as="section" key={chapter.id} id={chapter.id} className={styles.chapter} aria-labelledby={`${chapter.id}-title`}>
            <h2 id={`${chapter.id}-title`} className={styles.chapterTitle}>
              <span className={styles.chapterNumber}>{chapter.number}</span>
              {chapter.title}
            </h2>
            {chapter.intro && !query && <p className={styles.chapterIntro}>{chapter.intro}</p>}
            <ol className={styles.articles}>
              {chapter.articles.map(article => (
                <li key={article.number} id={`article-${article.number}`} className={styles.article}>
                  <span className={styles.articleNumber}>Art. {article.number}</span>
                  <div>
                    <h3 className={styles.articleTitle}>{article.title}</h3>
                    <p>{article.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Plaque>
        ))}
      </div>
    </div>
  );
}
