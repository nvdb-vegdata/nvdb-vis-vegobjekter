import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  panel: "panel",
  error: "error",
} as const;

export const useCheckboxTestId = createUseTestId(parts);
