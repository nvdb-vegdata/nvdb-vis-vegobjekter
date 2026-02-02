import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type LayoutContentProps = PropsWithChildren<{
  /** Primary gir hvit bakgrunn dersom den er satt til true, og hvit bakgrunn om den er satt til false */
  secondary?: boolean;
  fullWidth?: boolean;
}> &
  WithTestId;
