import { SVVSelect } from "../Select/Select";
import { SVVRadioGroup } from "../Radio/RadioGroup";
import { SelectOneProps } from "./SelectOne.types";
import { useSelectOneTestId } from "./test-parts";

export function SVVSelectOne({
  onChange,
  options,
  selected,
  legend,
  required,
  errorMessage,
  id,
  direction,
  selectSize,
  emptyChoiceText,
  name,
  testId,
  ...rest
}: SelectOneProps) {
  const testIds = useSelectOneTestId(testId);
  return options?.length > 5 ? (
    <SVVSelect
      onChange={onChange}
      options={options}
      selected={selected}
      legend={legend}
      id={id}
      required={required}
      errorMessage={errorMessage}
      selectSize={selectSize}
      emptyChoiceText={emptyChoiceText}
      testId={testIds.part("select")}
      {...rest}
    />
  ) : (
    <SVVRadioGroup
      onChange={onChange}
      options={options}
      selected={selected}
      legend={legend}
      required={required}
      errorMessage={errorMessage}
      id={id}
      name={name}
      direction={direction}
      testId={testIds.part("radioGroup")}
      {...rest}
    />
  );
}

SVVSelectOne.displayName = "SVVSelectOne";
