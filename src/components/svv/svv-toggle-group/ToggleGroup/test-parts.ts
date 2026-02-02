import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  label: "label"
} as const;

export const useToggleGroupTestId = createUseTestId(parts);

