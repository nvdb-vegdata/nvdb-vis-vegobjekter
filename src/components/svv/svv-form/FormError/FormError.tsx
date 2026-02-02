import { FormErrorProps } from "./FormError.types";
import { useFormErrorTestId } from "./test-parts";

export function SVVFormError({ children, className, id, testId }: FormErrorProps) {
  const testIds = useFormErrorTestId(testId);
  return (
    <div className={className} id={id} data-testid={testIds.root}>
      <div className="svv-form-error">{children}</div>
    </div>
  );
}

SVVFormError.displayName = "SVVFormError";
