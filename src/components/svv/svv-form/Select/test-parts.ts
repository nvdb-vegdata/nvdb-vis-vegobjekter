import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  label: "label",
  error: "error",
} as const;

export const useSelectTestId = createUseTestId(parts);
