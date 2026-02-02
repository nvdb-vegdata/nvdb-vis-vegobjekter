import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type LayoutPageTypeProps = PropsWithChildren<{
  /** Smalere bredde og sentret - til bruk på åpnesider som ikke er fullbredde */
  medium?: boolean;
  /** Artikkel bredde - smallerere mal som er tilpasset antall tegn per linje på teksten for lesbarhet */
  article?: boolean;
}> &
  WithTestId;
