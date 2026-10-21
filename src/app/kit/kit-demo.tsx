"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  DotsRow,
  Logo,
  ObliquePanel,
  Pin,
  PinCheckbox,
  Plaque,
  Scene,
  Selection,
  Spiral,
  TextAreaField,
  TextField,
} from "@/components/plaque";
import styles from "./kit.module.css";

const CREATURES = [
  { name: "Minotaures", open: false },
  { name: "Colosses", open: true },
  { name: "Centaures", open: true },
  { name: "Sirènes", open: false },
  { name: "Satyres", open: true },
];

export function KitDemo() {
  const [loading, setLoading] = useState(false);
  const [mic, setMic] = useState(true);
  const [dossier, setDossier] = useState(false);
  const [age, setAge] = useState("15");
  const [xp, setXp] = useState("Trois ans sur des serveurs semi-sérieux.");
  const [current, setCurrent] = useState(0);

  const ageNumber = Number(age);
  const ageError = age && (!Number.isInteger(ageNumber) || ageNumber < 18) ? "18 ans minimum." : undefined;

  return (
    <main className={`nh-container ${styles.page}`}>
      <header className={styles.head}>
        <Logo size={64} ring={2} />
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.h1}>Composants</h1>
            <Spiral />
          </div>
          <p className={styles.lead}>Les briques « Struck Plaque » du site, reprises de l&apos;interface en jeu.</p>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}>Boutons</h2>
        <Plaque className={styles.pad}>
          <div className={styles.row}>
            <Button variant="primary" size="lg">Rejoindre la Whitelist</Button>
            <Button variant="secondary" size="lg">Découvrir le lore</Button>
            <Button variant="cavity" size="sm">Discord</Button>
            <Button variant="ghost">Retour</Button>
            <Button variant="danger">Refuser</Button>
          </div>
          <div className={styles.row}>
            <Button size="sm">Taille 40</Button>
            <Button size="md">Taille 46</Button>
            <Button size="lg">Taille 52</Button>
            <Button disabled>Accéder au portail</Button>
            <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1600); }}>
              {loading ? "Envoi…" : "Envoyer"}
            </Button>
            <ButtonLink href="/" variant="secondary">Lien vers l&apos;accueil</ButtonLink>
          </div>
        </Plaque>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Plaque, badges, pins</h2>
        <div className={styles.grid2}>
          <Plaque unveil className={styles.padLg}>
            <DotsRow width={220} />
            <h3 className={styles.h3}>Le serveur</h3>
            <p className={styles.body}>Néa Hélikè est un serveur roleplay FiveM en whitelist. La cité grecque d&apos;Hélikè, engloutie en 373 av. J.-C., est revenue de nos jours.</p>
            <p className={styles.dim}>On attend un RP sérieux, écrit et suivi.</p>
          </Plaque>
          <Plaque className={styles.padLg}>
            <div className={styles.row}>
              <Badge>Joueur</Badge>
              <Badge size="lg">Membre</Badge>
              <Badge tone="gold">En attente de lecture</Badge>
              <Badge tone="success">Whitelisté</Badge>
              <Badge tone="danger">Refusée</Badge>
            </div>
            <div className={styles.row}>
              <Pin on /> <span className={styles.dim}>Ouvertes</span>
              <Pin on={false} /> <span className={styles.dim}>Closes</span>
            </div>
          </Plaque>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Lamelle de sélection</h2>
        <div className={styles.grid2}>
          <Plaque className={styles.list}>
            <DotsRow className={styles.listDots} />
            <div className={styles.listBody}>
              <Selection className={styles.band} style={{ transform: `translateY(${current * 58}px)` }} />
              {CREATURES.map((c, i) => (
                <button key={c.name} type="button" className={styles.item} aria-pressed={i === current} onClick={() => setCurrent(i)}>
                  <span className={i === current ? styles.itemCurrent : undefined}>{c.name}</span>
                  <span className={styles.itemState}>
                    {c.open ? "Ouvertes" : "Closes"}
                    <Pin on={c.open} />
                  </span>
                </button>
              ))}
            </div>
          </Plaque>
          <Plaque rivets="right" className={styles.padLg}>
            <Scene key={current} className={styles.sceneDemo} caption={`Illustration : ${CREATURES[current].name}, style peint bronze et or`} />
          </Plaque>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Formulaire</h2>
        <Plaque className={styles.padLg}>
          <div className={styles.form}>
            <TextField label="Pseudo Discord" locked defaultValue="thalia.wav" />
            <TextField label="ID Discord" locked defaultValue="284019375610482688" />
            <TextField label="Âge IRL" required inputMode="numeric" placeholder="18 ans minimum" value={age} onChange={e => setAge(e.target.value)} error={ageError} />
            <TextField label="Heures de RP" required inputMode="numeric" placeholder="Total approximatif" />
            <TextAreaField
              className={styles.full}
              label="Expériences"
              required
              maxLength={500}
              placeholder="Serveurs fréquentés, personnages marquants, styles de RP pratiqués…"
              value={xp}
              onChange={e => setXp(e.target.value)}
            />
            <div className={styles.full}>
              <div className={styles.stack}>
                <PinCheckbox checked={mic} onChange={e => setMic(e.target.checked)}>J&apos;ai un micro de bonne qualité</PinCheckbox>
                <PinCheckbox checked={dossier} onChange={e => setDossier(e.target.checked)}>
                  Je souhaite déposer un dossier de reprise <span className={styles.dim}>(entreprise, lead d&apos;une affinité ou d&apos;une créature)</span>
                </PinCheckbox>
                <PinCheckbox disabled checked={false}>Option indisponible</PinCheckbox>
              </div>
            </div>
          </div>
        </Plaque>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Panneau oblique</h2>
        <div className={styles.obliqueWrap}>
          <ObliquePanel cut={160} goldLine={3} className={styles.oblique}>
            <Scene className={styles.fill} caption="Illustration : vieux scribe du port penché sur une carte du golfe de Corinthe, lampe à huile" />
          </ObliquePanel>
        </div>
      </section>
    </main>
  );
}
