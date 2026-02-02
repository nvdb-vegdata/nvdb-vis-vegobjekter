import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  label: "label",
  trigger: "trigger",
  error: "error",
} as const;

export const useSearchFieldTestId = createUseTestId(parts);
