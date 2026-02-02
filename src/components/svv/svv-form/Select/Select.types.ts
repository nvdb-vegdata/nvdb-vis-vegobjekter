import { SelectHTMLAttributes } from "react";
import { BaseType } from "../shared.types";

export const SELECT_SIZES = ["xSmall", "small", "medium", "large"] as const;
export type SelectSize = (typeof SELECT_SIZES)[number];

export type SelectProps = {
  selectSize?: SelectSize;
  emptyChoiceText?: string;
  popoverText?: string;
  popoverTitle?: string;
  isFullWidth?: boolean;
  removeMargin?: boolean;
  description?: string;
} & BaseType &
  SelectHTMLAttributes<HTMLSelectElement>;
