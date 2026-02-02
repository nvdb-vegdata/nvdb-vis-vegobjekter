import React, { InputHTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type TextAreaProps = {
  label: string;
  className?: string;
  errorMessage?: string;
  id: string;
  required?: boolean;
  maxLength?: number;
  maxLengthHelperText?: string;
  maxLengthWarning?: string;
  aboveMaxLengthWarning?: string;
  value: string;
  popoverText?: string;
  popoverTitle?: string;
  isFullWidth?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  description?: string;
  hideWarning?: boolean;
} & InputHTMLAttributes<HTMLTextAreaElement> &
  WithTestId;
