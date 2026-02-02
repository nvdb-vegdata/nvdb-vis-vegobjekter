import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  select: "select",
  radioGroup: "radioGroup",
} as const;

export const useSelectOneTestId = createUseTestId(parts);
