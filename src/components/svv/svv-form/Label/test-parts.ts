import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  panel: "panel",
} as const;

export const useLabelTestId = createUseTestId(parts);
