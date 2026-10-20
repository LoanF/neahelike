import Link from "next/link";
import type { ComponentProps } from "react";
import type { ButtonSize, ButtonVariant } from "@/components/arc/button/button";
import buttonStyles from "@/components/arc/button/button.module.css";
import { cx } from "./plaque";

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Lien de navigation habillé comme le bouton Arc (mêmes variantes plaque). */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...link }: ButtonLinkProps) {
  return (
    <Link className={cx(buttonStyles.button, buttonStyles[variant], buttonStyles[size], className)} {...link}>
      <span className={buttonStyles.labelPhase}>{children}</span>
    </Link>
  );
}
