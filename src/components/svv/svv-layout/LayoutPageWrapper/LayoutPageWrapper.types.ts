import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type LayoutPageWrapperProps = PropsWithChildren<{
  secondary?: boolean;
}> &
  WithTestId;
