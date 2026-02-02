import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type LabelProps = PropsWithChildren<{
  className?: string;
  htmlFor?: string;
  id?: string;
  required?: boolean;
  popoverText?: string;
  popoverTitle?: string;
}> &
  WithTestId;
