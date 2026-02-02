import { InputHTMLAttributes } from "react";
import { BaseType } from "../shared.types";

export const RADIO_DIRECTIONS = ["horizontal", "vertical"] as const;
export type RadioDirection = (typeof RADIO_DIRECTIONS)[number];

export type RadioGroupProps = {
  name: string;
  direction?: RadioDirection;
  popoverText?: string;
  popoverTitle?: string;
  removeMargin?: boolean;
  description?: string;
  isFullWidth?: boolean;
  sm?: boolean;
} & BaseType &
  InputHTMLAttributes<HTMLInputElement>;
