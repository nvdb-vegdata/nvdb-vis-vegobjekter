import React, { InputHTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const TEXT_INPUT_SIZES = ["xsmall", "small", "medium", "large"] as const;
export type TextInputSize = (typeof TEXT_INPUT_SIZES)[number];

export type TextInputProps = {
  label: string;
  className?: string;
  errorMessage?: string;
  inputSize?: TextInputSize;
  id: string;
  required?: boolean;
  maxLength?: number;
  maxLengthHelperText?: string;
  maxLengthWarning?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  popoverText?: string;
  popoverTitle?: string;
  removeMargin?: boolean;
  isFullWidth?: boolean;
  description?: string;
  showWarning?: boolean;
} & InputHTMLAttributes<HTMLInputElement> &
  WithTestId;
