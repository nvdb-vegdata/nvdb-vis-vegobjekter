import React, { createContext, forwardRef, isValidElement, useMemo } from "react";
import classNames from "classnames";
import { useChipTestId } from "./test-parts";
import { ChipGroupContextProps, ChipGroupProps } from "./ChipGroup.types";

export const ChipGroupContext = createContext<ChipGroupContextProps | null>(null);

export const SVVChipGroup = forwardRef<HTMLUListElement, ChipGroupProps>(
  ({ size = "md", children, className, testId, ...rest }: ChipGroupProps, ref) => {
    const chipGroupContextValue = useMemo(() => {
      return {
        size,
      };
    }, [size]);
    const testIds = useChipTestId(testId);
    return (
      <ul
        ref={ref}
        className={classNames(`svv-chip-group`, className)}
        {...rest}
        data-testid={testIds.root}
      >
        <ChipGroupContext.Provider value={chipGroupContextValue}>
          {React.Children.toArray(children).map((child, index) =>
            isValidElement(child) ? <li key={`chip-${index}`}>{child}</li> : null,
          )}
        </ChipGroupContext.Provider>
      </ul>
    );
  },
);

SVVChipGroup.displayName = "SVVChipGroup";
