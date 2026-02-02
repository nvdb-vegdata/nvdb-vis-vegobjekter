import React, { InputHTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type CheckboxProps = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  description2?: React.ReactNode;
  description3?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
  sm?: boolean;
  error?: string;
  partOfGroup?: boolean;
  removeMargin?: boolean;
  isFullwidth?: boolean;
} & InputHTMLAttributes<HTMLInputElement> &
  WithTestId;
