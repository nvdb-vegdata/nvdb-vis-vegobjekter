import React from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const ALERT_SIZES = ["sm", "md", "lg"] as const;
export type AlertSize = (typeof ALERT_SIZES)[number];

export const ALERT_TYPES = [
  "error",
  "warning",
  "info",
  "success",
  "infoMessage",
  "continousText",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
export type AlertHeadingLevel = (typeof ALERT_HEADING_LEVELS)[number];

export type AlertProps = React.PropsWithChildren<{
  type: AlertType;
  isCenter?: boolean;
  isFullWidth?: boolean;
  className?: string;
  closeText?: string;
  heading?: string;
  headingLevel?: AlertHeadingLevel;
  size?: AlertSize;
  onDismiss?: () => void;
}> &
  WithTestId;
