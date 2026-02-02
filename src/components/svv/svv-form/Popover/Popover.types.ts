import { ReactNode } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const POPOVER_HEADING_LEVELS = ["h2", "h3", "h4", "h5", "h6"] as const;
export type PopoverHeadingLevel = (typeof POPOVER_HEADING_LEVELS)[number];

export type PopoverProps = {
  explanationText: ReactNode | string;
  closeText?: string;
  title?: string;
  ariaLabel?: string;
  headingLevel?: PopoverHeadingLevel;
} & WithTestId;
