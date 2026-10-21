import type { Metadata } from "next";
import { Badge, ButtonLink, DotsRow, Pin, Plaque, Rivet, Scene, Socket } from "@/components/plaque";
import { Emblem } from "@/components/site/emblem";
import { EmblemSocket, PageIntro } from "@/components/site/section";
import {
  AFFINITY_INTRO,
  AFFINITY_RULES,
  ASSEMBLY_INTRO,
  CITY_GOD,
  CREATURE_INTRO,
  CREATURE_RULES,
  GODS,
  JUDGEMENT,
  LAW_STEPS,
  LEGENDS,
  ORIGINS,
  OTHER_GODS,
  OTHER_PLACES,
  PLACES,
  POLES,
  RANKS,
  TIMELINE,
} from "@/content/lore";
import { SITE } from "@/content/site";
import type { AffinityView, CreatureView } from "@/lib/factions";
import { getFactions } from "@/lib/factions";
import { LoreTabs } from "./lore-tabs";
import styles from "./lore.module.css";

export const metadata: Metadata = {
  title: "Lore",
  description: "L'histoire de Néa Hélikè : la chute d'Hélikè, les dieux protecteurs, l'Assemblée des Cinq, les affinités divines et les créatures mystiques.",
};

const ROMAN = ["I", "II", "III", "IV", "V"];

function ChapterHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className={styles.chapterHead}>
      <h2 className={styles.chapterTitle}>{title}</h2>
      {lead && <p className={styles.chapterLead}>{lead}</p>}
    </div>
  );
}

/* ---------- La cité ---------- */
function CityPanel() {
  return (
    <>
      <ChapterHead title="La cité renée des flots" lead="Tout commence par une catastrophe." />
      <Plaque className={styles.origins}>
        <DotsRow className={styles.originsDots} />
        {ORIGINS.map(origin => (
          <div key={origin.date} className={styles.origin}>
            <div className={styles.originDate}>
              <span className={styles.originYear}>{origin.date}</span>
              <span className={styles.originLabel}>{origin.label}</span>
            </div>
            <p className={styles.originText}>{origin.text}</p>
          </div>
        ))}
      </Plaque>

      <h3 className={styles.subTitle}>Chronologie</h3>
      <ol className={styles.timeline} aria-label="Chronologie, toutes les dates sont avant J.-C.">
        {TIMELINE.map(step => {
          const current = "current" in step && step.current;
          return (
            <li key={step.year} className={current ? styles.timelineCurrent : undefined}>
              <Pin on={!!current} className={styles.timelinePin} />
              <span className={styles.timelineYear}>{step.year}</span>
              <span className={styles.timelineEvent}>{step.event}</span>
              {current && <Badge tone="gold">Vous êtes ici</Badge>}
            </li>
          );
        })}
      </ol>
      <p className={styles.note}>Toutes les dates sont avant J.-C.</p>

      <h3 id="cite-carte" className={styles.subTitle}>La carte</h3>
      <Plaque className={styles.map}>
        <a href="/images/lore/carte.webp" target="_blank" rel="noreferrer" className={styles.mapLink}>
          {/* eslint-disable-next-line @next/next/no-img-element -- carte servie telle quelle, ouverte en grand au clic */}
          <img src="/images/lore/carte.webp" alt="Carte de Néa Hélikè : le port, la statue de Poséidon, le stade, l'agora, le temple, le labyrinthe, la forêt et le cimetière." className={styles.mapImage} />
          <span className={styles.mapHint}>Ouvrir la carte en grand</span>
        </a>
      </Plaque>

      <h3 className={styles.subTitle}>Les lieux incontournables</h3>
      <div className={styles.placesGrid}>
        {PLACES.map(place => (
          <div key={place.name} className={styles.place}>
            <EmblemSocket name={place.emblem} size={44} />
            <div>
              <p className={styles.placeName}>{place.name}</p>
              <p className={styles.placeText}>{place.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.note}>{OTHER_PLACES}</p>
    </>
  );
}

/* ---------- Les dieux ---------- */
function GodsPanel() {
  return (
    <>
      <ChapterHead title="Les dieux protecteurs" lead="Néa Hélikè vit sous le regard des dieux, et d'abord sous celui du maître des mers." />
      <Plaque className={styles.cityGod}>
        <EmblemSocket name={CITY_GOD.emblem} size={96} />
        <div className={styles.cityGodText}>
          <span className={styles.kicker}>{CITY_GOD.domain}</span>
          <h3 className={styles.cityGodName}>{CITY_GOD.name}</h3>
          <p className={styles.bodyLg}>{CITY_GOD.text}</p>
        </div>
      </Plaque>
      <div className={styles.gods}>
        {GODS.map(god => (
          <Plaque key={god.name} rivets="right" className={styles.god}>
            <EmblemSocket name={god.emblem} />
            <div>
              <span className={styles.kicker}>{god.domain}</span>
              <h3 className={styles.cardTitle}>{god.name}</h3>
              <p>{god.text}</p>
            </div>
          </Plaque>
        ))}
        <div className={styles.otherGods}>
          <span className={styles.kicker}>Aussi honorés</span>
          <p className={styles.otherGodsList}>{OTHER_GODS.join(" · ")}</p>
        </div>
      </div>
    </>
  );
}

/* ---------- L'Assemblée ---------- */
function AssemblyPanel() {
  return (
    <>
      <ChapterHead title="L'Assemblée des Cinq" lead={ASSEMBLY_INTRO} />
      <div className={styles.assembly}>
        {POLES.map((pole, i) => (
          <Plaque key={pole.pole} rivets="none" className={styles.pole} data-seat={i}>
            <div className={styles.poleHead}>
              <Emblem name={pole.emblem} size={20} />
              <span className={styles.kicker}>{pole.pole}</span>
            </div>
            <h3 className={styles.cardTitle}>{pole.god}</h3>
            <p className={styles.dim}>{pole.text}</p>
          </Plaque>
        ))}
        <div className={styles.table}>
          <span className={styles.kicker}>Marbre · ronde</span>
          <span className={styles.tableName}>La Table d&apos;Olympe</span>
          <span className={styles.tableVotes}>5 voix égales</span>
        </div>
      </div>
      <p className={styles.quote}>Chaque conseiller dirige un pôle placé sous la protection d&apos;une divinité.</p>

      <h3 className={styles.subTitle}>Les grades d&apos;un pôle</h3>
      <p className={styles.dim}>Chaque conseiller choisit lui-même les membres de son pôle.</p>
      <ol className={styles.ranks}>
        {RANKS.map((rank, i) => (
          <li key={rank.name} className={i === 0 ? styles.rankTop : undefined} style={{ width: `${62 + i * 12}%` }}>
            <span className={styles.rankName}>{rank.name}</span>
            <span className={styles.rankText}>{rank.text}</span>
          </li>
        ))}
      </ol>

      <h3 className={styles.subTitle}>Le vote des lois</h3>
      <ol className={styles.law}>
        {LAW_STEPS.map((step, i) => (
          <li key={step}>
            <Socket className={styles.lawNumber}>{ROMAN[i]}</Socket>
            <p>{step}</p>
          </li>
        ))}
      </ol>
      <div className={styles.majority}>
        <span className={styles.majorityPins} aria-hidden="true">
          {[true, true, true, false, false].map((on, i) => <Pin key={i} on={on} />)}
        </span>
        <span>Majorité requise : <strong>3 voix sur 5</strong></span>
      </div>

      <h3 id="assemblee-jugement" className={styles.subTitle}>Le Jugement des Dieux</h3>
      <p className={styles.bodyLg}>{JUDGEMENT.intro}</p>
      <ol className={styles.judgement}>
        <li>
          <Socket className={styles.judgementNumber}>I</Socket>
          <div className={styles.judgementBody}>
            <h4 className={styles.cardTitle}>Qui peut se présenter ?</h4>
            <p>Seuls les citoyens qui remplissent deux conditions :</p>
            <div className={styles.conditions}>
              {JUDGEMENT.conditions.map(condition => (
                <div key={condition.text} className={styles.condition}>
                  <Emblem name={condition.emblem} size={22} />
                  <span>{condition.text}</span>
                </div>
              ))}
            </div>
          </div>
        </li>
        <li>
          <Socket className={styles.judgementNumber}>II</Socket>
          <div className={styles.judgementBody}>
            <h4 className={styles.cardTitle}>Une semaine d&apos;épreuves</h4>
            <p>Les candidats sont mis à l&apos;épreuve, dans leur corps comme dans leur esprit.</p>
            <div className={styles.trials}>
              <div>
                <span className={styles.kicker}>Épreuves physiques</span>
                <div className={styles.chips}>{JUDGEMENT.physical.map(trial => <Badge key={trial} size="lg">{trial}</Badge>)}</div>
              </div>
              <div>
                <span className={styles.kicker}>Épreuves mentales</span>
                <div className={styles.chips}>{JUDGEMENT.mental.map(trial => <Badge key={trial} size="lg">{trial}</Badge>)}</div>
              </div>
            </div>
          </div>
        </li>
        <li>
          <Socket className={styles.judgementNumber}>III</Socket>
          <div className={styles.judgementBody}>
            <h4 className={styles.cardTitle}>Le rituel final</h4>
            <p>{JUDGEMENT.final}</p>
          </div>
        </li>
      </ol>
      <div className={styles.outcome}>{JUDGEMENT.outcome}</div>
    </>
  );
}

/* ---------- Affinités ---------- */
function AffinitiesPanel({ affinities }: { affinities: AffinityView[] }) {
  return (
    <>
      <ChapterHead title="Les affinités divines" lead={AFFINITY_INTRO} />
      <div className={styles.affinities}>
        {affinities.map(affinity => {
          const open = affinity.joinOpen;
          return (
            <Plaque key={affinity.id} id={`affinites-${affinity.id}`} className={styles.affinity}>
              <Scene className={styles.affinityArt} caption={`Illustration : ${affinity.art}`} />
              <div className={styles.affinityBody}>
                <div className={styles.affinityHead}>
                  <EmblemSocket name={affinity.emblem} size={56} />
                  <div>
                    <h3 className={styles.affinityName}>{affinity.name}</h3>
                    <span className={styles.dim}>{affinity.divine ? `Affinité de ${affinity.god}` : "Sans affinité divine"}</span>
                  </div>
                </div>
                <p className={styles.values}>{affinity.values}</p>
                <p>{affinity.text}</p>
                <div className={styles.affinityFoot}>
                  <span><span className={styles.kicker}>Pouvoir</span> · {affinity.divine ? affinity.element : "Aucun"}</span>
                  <span className={styles.dim}>{affinity.divine ? "Prêtre : à désigner" : "Ni prêtre ni rituel"}</span>
                </div>
                <span className={styles.places}>
                  <Pin on={open} /> {open ? "Places ouvertes" : "Places closes pour le moment"}
                </span>
              </div>
            </Plaque>
          );
        })}
      </div>
      <h3 className={styles.subTitle}>Règles des affinités</h3>
      <ol className={styles.rules}>
        {AFFINITY_RULES.map((rule, i) => (
          <li key={rule}>
            <Socket className={styles.ruleNumber}>{ROMAN[i]}</Socket>
            <p>{rule}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ---------- Créatures ---------- */
function CreaturesPanel({ creatures }: { creatures: CreatureView[] }) {
  return (
    <>
      <ChapterHead title="Les créatures mystiques" lead={CREATURE_INTRO} />
      <div className={styles.creatures}>
        {creatures.map(creature => {
          const open = creature.joinOpen;
          return (
            <Plaque key={creature.id} id={`creatures-${creature.id}`} rivets="none" className={styles.creature}>
              <Scene className={styles.creatureArt} caption={`Illustration : ${creature.art}`} />
              <div className={styles.creatureBody}>
                <Rivet side="right" />
                <div className={styles.creatureHead}>
                  <EmblemSocket name={creature.emblem} size={48} />
                  <h3 className={styles.creatureName}>Les {creature.name}</h3>
                </div>
                <p className={styles.bodyLg}>{creature.origin}</p>
                <dl className={styles.traits}>
                  <div><dt className={styles.kicker}>Capacités</dt><dd>{creature.strengths}</dd></div>
                  <div><dt className={styles.kicker}>Faiblesses</dt><dd>{creature.weaknesses}</dd></div>
                  <div><dt className={styles.kicker}>Affinité amicale</dt><dd className={styles.friendly}>{creature.friendly}</dd></div>
                </dl>
                <span className={styles.places}>
                  <Pin on={open} /> {open ? "Places ouvertes à la candidature" : "Places closes pour le moment"}
                </span>
              </div>
            </Plaque>
          );
        })}
      </div>
      <div className={styles.rulesBox}>
        <span className={styles.kicker}>Règles</span>
        <p>{CREATURE_RULES}</p>
      </div>
    </>
  );
}

/* ---------- Légendes ---------- */
function LegendsPanel() {
  return (
    <>
      <ChapterHead title="Les légendes de la cité" lead="Quatre récits que chaque habitant connaît par cœur." />
      <div className={styles.legends}>
        {LEGENDS.map(legend => (
          <Plaque key={legend.name} className={styles.legend}>
            <EmblemSocket name={legend.emblem} size={56} />
            <h3 className={styles.cardTitle}>{legend.name}</h3>
            <p className={styles.legendText}>{legend.text}</p>
            <p className={styles.coda}>{legend.coda}</p>
          </Plaque>
        ))}
      </div>
    </>
  );
}

/** Les disponibilités changent depuis l'administration : la page est régénérée au plus tard toutes les 5 minutes. */
export const revalidate = 300;

export default async function LorePage() {
  const { affinities, creatures } = await getFactions();
  return (
    <>
      <PageIntro title="Le Lore" lead="Hélikè a sombré en une nuit. Ses survivants ont juré de ne plus jamais offenser les dieux. Voici la cité qu'ils ont bâtie." />
      <div className={styles.wrap}>
        <LoreTabs
          tabs={[
            { id: "cite", label: "La cité", content: <CityPanel /> },
            { id: "dieux", label: "Les dieux", content: <GodsPanel /> },
            { id: "assemblee", label: "L'Assemblée", content: <AssemblyPanel /> },
            { id: "affinites", label: "Affinités", content: <AffinitiesPanel affinities={affinities} /> },
            { id: "creatures", label: "Créatures", content: <CreaturesPanel creatures={creatures} /> },
            { id: "legendes", label: "Légendes", content: <LegendsPanel /> },
          ]}
        />
        <div className={styles.cta}>
          <span>Ta place t&apos;attend dans la cité.</span>
          <ButtonLink href={SITE.joinUrl} size="lg">Rejoindre la Whitelist</ButtonLink>
        </div>
      </div>
    </>
  );
}
