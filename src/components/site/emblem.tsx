import type { ReactNode } from "react";

/*
 * Emblèmes dessinés au trait, façon gravure sur bronze. Pas de pictos d'interface :
 * chaque tracé est propre au lore (affinités, créatures, dieux, lieux, légendes).
 */
const PATHS = {
  bolt: <path d="M13.5 2.5 6 13.2h5.2L9.6 21.5 18 10.2h-5.4l.9-7.7Z" />,
  waves: (
    <>
      <path d="M2.5 8.5c2.4-2 4.6-2 7 0s4.6 2 7 0 4.6-2 5 0" />
      <path d="M2.5 13c2.4-2 4.6-2 7 0s4.6 2 7 0 4.6-2 5 0" />
      <path d="M2.5 17.5c2.4-2 4.6-2 7 0s4.6 2 7 0 4.6-2 5 0" />
    </>
  ),
  moon: <path d="M15.8 3.4a8.6 8.6 0 1 0 4.8 13.9A7 7 0 0 1 15.8 3.4Z" />,
  flame: (
    <>
      <path d="M12 2.8c.6 3.4 5.6 5.6 5.6 11a5.6 5.6 0 0 1-11.2 0c0-2.8 1.4-4.4 2.8-5.8.2 1.8 1 2.8 2 3.3-.6-3 .2-5.8.8-8.5Z" />
      <path d="M12 21.2a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.4-2.6 2.6-4 1.2 1.4 2.6 2.4 2.6 4a2.6 2.6 0 0 1-2.6 2.6Z" />
    </>
  ),
  shield: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 3.4v4.2M12 16.4v4.2M3.4 12h4.2M16.4 12h4.2" />
    </>
  ),
  trident: (
    <>
      <path d="M12 3v18M8.6 21h6.8M10 17.6h4" />
      <path d="M5.6 4.6v4.6a6.4 6.4 0 0 0 12.8 0V4.6" />
      <path d="m4 6.4 1.6-2.8 1.6 2.8M10.4 4.6 12 1.8l1.6 2.8M16.8 6.4l1.6-2.8L20 6.4" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21.5V6" />
      <path d="M12 6c-1.6-.4-2.6-1.6-2.6-3.2C11 3.2 12 4.4 12 6Zm0 0c1.6-.4 2.6-1.6 2.6-3.2C13 3.2 12 4.4 12 6Z" />
      <path d="M12 10.4c-2-.2-3.4-1.4-3.6-3.2 2 .2 3.4 1.4 3.6 3.2Zm0 0c2-.2 3.4-1.4 3.6-3.2-2 .2-3.4 1.4-3.6 3.2Z" />
      <path d="M12 14.8c-2-.2-3.4-1.4-3.6-3.2 2 .2 3.4 1.4 3.6 3.2Zm0 0c2-.2 3.4-1.4 3.6-3.2-2 .2-3.4 1.4-3.6 3.2Z" />
    </>
  ),
  hammer: (
    <>
      <path d="M4.2 6.2h9.2v4.4H4.2z" />
      <path d="M13.4 7.4h3.2l2.4-1.6v5.2l-2.4-1.4h-3.2" />
      <path d="M8.8 10.6v10.6" />
    </>
  ),
  cup: (
    <>
      <path d="M4.6 5h14.8c0 4.4-3.2 7.4-7.4 7.4S4.6 9.4 4.6 5Z" />
      <path d="M12 12.4v6M8 20.6h8M4.6 5 2.8 3.6M19.4 5l1.8-1.4" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="6.2" strokeDasharray="1 1.6" />
      <path d="M9.4 15.2V9.6l2.6 3 2.6-3v5.6" />
    </>
  ),
  staff: (
    <>
      <path d="M12 2.8v18.4" />
      <path d="M12 6.4c3 0 3 3 0 3s-3 3 0 3 3 3 0 3-3 2.4 0 2.4" />
    </>
  ),
  scales: (
    <>
      <path d="M12 3.2v17.6M7.6 20.8h8.8M4.4 6.8h15.2" />
      <path d="m4.4 6.8-2.6 6h5.2l-2.6-6ZM19.6 6.8l-2.6 6h5.2l-2.6-6Z" />
      <path d="M1.8 12.8a2.6 2.6 0 0 0 5.2 0M17 12.8a2.6 2.6 0 0 0 5.2 0" />
    </>
  ),
  hearth: (
    <>
      <path d="M4.6 20.6h14.8M6.4 20.6l1.4-5.4h8.4l1.4 5.4" />
      <path d="M12 3.4c.4 2.4 3.8 3.8 3.8 7.2a3.8 3.8 0 0 1-7.6 0c0-1.8 1-2.8 1.8-3.8.2 1.2.6 1.8 1.4 2.2-.4-2 .2-3.8.6-5.6Z" />
    </>
  ),
  temple: (
    <>
      <path d="M3 8.4 12 3.4l9 5H3Z" />
      <path d="M4.4 10.6h15.2M6 10.6v7.6M10 10.6v7.6M14 10.6v7.6M18 10.6v7.6M3.6 18.2h16.8M2.6 20.8h18.8" />
    </>
  ),
  statue: (
    <>
      <circle cx="10.4" cy="4.6" r="1.8" />
      <path d="M8.6 15.4 9 8.8h2.8l.6 6.6" />
      <path d="M17 2.6v13M15.4 4.4 17 2.6l1.6 1.8" />
      <path d="M11.8 9.6 17 8" />
      <path d="M7.2 15.4h12M8.6 15.4v3.2h9.2v-3.2M5.6 21h15.2" />
    </>
  ),
  laurel: (
    <>
      <path d="M12 20.6c-4.6-1-7.6-4.8-7.6-9.6 0-2.4.8-4.6 2-6.2M12 20.6c4.6-1 7.6-4.8 7.6-9.6 0-2.4-.8-4.6-2-6.2" />
      <path d="M5 9.6c1.4 0 2.4.8 2.8 2M5.4 14c1.4-.2 2.6.4 3.2 1.6M7.4 5.8c1.2.4 1.8 1.4 1.8 2.6M19 9.6c-1.4 0-2.4.8-2.8 2M18.6 14c-1.4-.2-2.6.4-3.2 1.6M16.6 5.8c-1.2.4-1.8 1.4-1.8 2.6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.4 12.6C5 8.6 8.2 6.6 12 6.6s7 2 9.6 6c-2.6 4-5.8 6-9.6 6s-7-2-9.6-6Z" />
      <circle cx="12" cy="12.6" r="2.8" />
      <path d="M12 2.4v2M7.4 3.4l.8 1.8M16.6 3.4l-.8 1.8" />
    </>
  ),
  river: (
    <>
      <path d="M3 6.4c3-1.6 5-.2 6 1.6s3.6 3.2 6.4 1.8 4.6-.6 5.6.4" />
      <path d="M3 12.4c3-1.6 5-.2 6 1.6s3.6 3.2 6.4 1.8 4.6-.6 5.6.4" />
      <circle cx="8" cy="19.6" r="1.6" />
    </>
  ),
  labyrinth: <path d="M3.4 3.4h17.2v17.2H6.6V6.6h10.8v10.8H9.8V9.8h4.4v4.4" />,
  bull: (
    <>
      <path d="M3 4.6c0 3 2 4.6 4.6 4.6M21 4.6c0 3-2 4.6-4.6 4.6" />
      <path d="M7.6 9.2h8.8l-.8 6.2c-.4 2.8-1.8 5-3.6 5s-3.2-2.2-3.6-5l-.8-6.2Z" />
      <path d="M10.2 17.6h3.6M9.8 12.4h.01M14.2 12.4h.01" />
    </>
  ),
  colossus: (
    <>
      <path d="M8.8 2.8h6.4v4.4H8.8z" />
      <path d="M6 9.4h12v6.2H6z" />
      <path d="M8.4 15.6v5.6M15.6 15.6v5.6M6 9.4 3.6 14M18 9.4l2.4 4.6" />
      <path d="M12 11.2c.9 1 1.2 1.6 1.2 2.2a1.2 1.2 0 0 1-2.4 0c0-.6.3-1.2 1.2-2.2Z" />
    </>
  ),
  bow: (
    <>
      <path d="M6.2 3a13 13 0 0 1 0 18" />
      <path d="M6.2 3v18" />
      <path d="M6.2 12H21M17.6 8.8 21 12l-3.4 3.2M3.4 10.4 6.2 12l-2.8 1.6" />
    </>
  ),
  shell: (
    <>
      <path d="M12 20.4 3.2 9.2a12 12 0 0 1 17.6 0L12 20.4Z" />
      <path d="M12 20.4 8 6.2M12 20.4V5.4M12 20.4 16 6.2M12 20.4 5.2 7.6M12 20.4l6.8-12.8" />
    </>
  ),
  pipes: (
    <>
      <path d="M4.6 4.2v10.4M7.6 4.2v12.6M10.6 4.2v14.4M13.6 4.2v12.6M16.6 4.2v10.4M19.6 4.2v8.4" />
      <path d="M3.4 7.6h17.4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type EmblemName = keyof typeof PATHS;

export function Emblem({ name, size = 24, strokeWidth = 1.5, className }: { name: EmblemName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 1px 0 #000)" }}
    >
      {PATHS[name]}
    </svg>
  );
}
