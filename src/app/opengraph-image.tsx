import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Image d'aperçu des liens partagés (Discord, réseaux) : générée une fois au build.
export const alt = "Néa Hélikè, serveur roleplay FiveM whitelist dans l'univers de la mythologie grecque";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#d1a64a";
const PARCHMENT = "#f1ece2";
const FONTS = "node_modules/@fontsource/marcellus/files";

export default async function OpenGraphImage() {
  const [logo, latin, latinExt] = await Promise.all([
    readFile(join(process.cwd(), "public/images/logo.png")),
    readFile(join(process.cwd(), FONTS, "marcellus-latin-400-normal.woff")),
    readFile(join(process.cwd(), FONTS, "marcellus-latin-ext-400-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "radial-gradient(circle at 28% 50%, #3a2a17 0%, #16110b 45%, #0b0907 100%)",
          border: `6px solid ${GOLD}`,
          fontFamily: "Marcellus",
        }}
      >
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={300}
          height={300}
          alt=""
          style={{ borderRadius: 150, boxShadow: `0 0 0 4px #000, 0 0 0 9px ${GOLD}, 0 24px 48px #000` }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 96, letterSpacing: 4, color: GOLD, lineHeight: 1 }}>NÉA HÉLIKÈ</div>
          <div style={{ display: "flex", width: 140, height: 3, background: GOLD }} />
          <div style={{ display: "flex", fontSize: 40, color: PARCHMENT }}>Serveur roleplay FiveM whitelist</div>
          <div style={{ display: "flex", fontSize: 30, color: "#b9b09d", maxWidth: 620 }}>
            La cité engloutie est sortie des eaux. Les dieux sont revenus avec elle.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Marcellus", data: latin, weight: 400, style: "normal" },
        { name: "Marcellus", data: latinExt, weight: 400, style: "normal" },
      ],
    },
  );
}
