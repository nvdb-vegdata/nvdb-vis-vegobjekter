import { DescriptionProps } from "./Description.types";
import { useDescriptionTestId } from "./test-parts";

export function Description({ content, id, testId }: DescriptionProps) {
  const testIds = useDescriptionTestId(testId);
  return (
    <p className="svv-form-description" id={id} data-testid={testIds.root}>
      {content}
    </p>
  );
}

Description.displayName = "Description";
