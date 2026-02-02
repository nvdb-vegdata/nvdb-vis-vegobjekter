import {
  ElementType,
  ButtonHTMLAttributes,
  ReactElement,
  HTMLAttributes,
  AnchorHTMLAttributes,
} from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const BUTTON_SIZES = ["sm", "md", "lg"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const BUTTON_VARIANTS = ["primary", "secondary", "tertiary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export type ButtonType<T extends ElementType> = {
  size?: ButtonSize;
  color?: ButtonVariant;
  loading?: boolean;
  loadingString?: string;
  /**
   * @deprecated icon er fjernet fra nyere versjoner av SVVButton, og vil bli fjernet permanent 02.01.2026.
   * Hvis du ønsker en knapp med ikon, send inn ikon som children".
   */
  icon?: ReactElement<{ "aria-hidden"?: boolean }>;
  /**
   * @deprecated iconPlacement er fjernet fra nyere versjoner av SVVButton, og vil bli fjernet permanent 02.01.2026.
   * Hvis du ønsker en knapp med ikoner så send inn ikon som children".
   */
  iconPlacement?: "left" | "right";
  as?: T;
  /**
   * @deprecated looksLikeLink er fjernet fra nyere versjoner av SVVButton, og vil bli fjernet permanent 02.01.2026.
   * Hvis du ønsker en knapp som ser ut som ei lenke, bruk istedenfor SVVLink med as="button".
   */
  looksLikeLink?: boolean;
} & WithTestId;

export type CancelButtonType<T extends ElementType> = {
  as?: T;
  asElement?: any;
  hrefAttribute?: string;
} & WithTestId;

export type ButtonIconType = {
  icon?: ReactElement<{ "aria-hidden"?: boolean }>;
  ariaLabel: string;
  square?: boolean;
  size?: ButtonSize;
  loading?: boolean;
  loadingString?: string;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  WithTestId;

/* The following types are deprecated */

type BaseButtonType = {
  small?: boolean;
  color?: "primary" | "secondary";
  loading?: boolean;
  loadingString?: string;
  icon?: ReactElement<{ "aria-hidden"?: boolean }>;
  iconPlacement?: "left" | "right";
  looksLikeLink?: boolean;
} & WithTestId;

export type ButtonCustomType = (
  | { asElement: any; hrefAttribute: string }
  | { asElement?: never; hrefAttribute?: never }
) &
  BaseButtonType &
  HTMLAttributes<HTMLOrSVGElement> &
  ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export type ButtonLinkType = {
  href: string;
} & Omit<BaseButtonType, "loading" | "loadingString"> &
  AnchorHTMLAttributes<HTMLAnchorElement>;
