import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type LayoutBannerProps = PropsWithChildren<{
  /** Secondary gir grå bakgrunn dersom den er satt til true, og hvit bakgrunn om den er satt til false */
  secondary?: boolean;
  medium?: boolean;
  noPaddingTop?: boolean;
}> &
  WithTestId;
