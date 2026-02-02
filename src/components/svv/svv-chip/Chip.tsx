import { forwardRef, useContext } from "react";
import classNames from "classnames";
import { XmarkLarge } from "@komponentkassen/svv-icons";
import { ChipGroupContext } from "./ChipGroup";
import { useChipTestId } from "./test-parts";
import { ChipProps } from "./Chip.types";

export const SVVChip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ title, size = "md", removable = false, className, testId, ...rest }: ChipProps, ref) => {
    const group = useContext(ChipGroupContext);
    const testIds = useChipTestId(testId);
    return (
      <button
        className={classNames(className, "svv-chip", `svv-chip--${group?.size || size}`)}
        ref={ref}
        {...rest}
        data-testid={testIds.root}
      >
        <span>{title}</span>
        {removable && (
          <span className="svv-chip-icon-content" data-testid={testIds.part("close")}>
            <XmarkLarge className="svv-chip-close-icon" />
          </span>
        )}
      </button>
    );
  },
);

SVVChip.displayName = "SVVChip";
