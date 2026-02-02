import React, { InputHTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type RadioProps = {
  text: React.ReactNode;
  description?: React.ReactNode;
  description2?: React.ReactNode;
  description3?: React.ReactNode;
  ariaDescribedby?: string;
  sm?: boolean;
} & InputHTMLAttributes<HTMLInputElement> &
  WithTestId;
