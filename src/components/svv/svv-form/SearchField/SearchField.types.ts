import { InputHTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const SEARCH_FIELD_SIZES = ["xsmall", "small", "medium", "large"] as const;
export type SearchFieldSize = (typeof SEARCH_FIELD_SIZES)[number];

export type SearchFieldProps = {
  id: string;
  label: string;
  onSearch: (text: string) => void;
  placeholder: string;
  className?: string;
  errorMessage?: string;
  inputSize?: SearchFieldSize;
  required?: boolean;
  popoverText?: string;
  popoverTitle?: string;
  searchText?: string;
  buttonText?: string;
  description?: string;
  wrapInFormTag?: boolean;
  onTextChange?: (text: string) => void;
} & InputHTMLAttributes<HTMLInputElement> &
  WithTestId;
