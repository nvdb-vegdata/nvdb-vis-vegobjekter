import type { HTMLAttributes, MutableRefObject, ReactNode } from "react";

export type RovingIndexItemProps = {
    value?: string;
} & HTMLAttributes<HTMLElement>;

export type RovingIndexRootProps = {
    children: ReactNode;
    valueId?: string;
} & HTMLAttributes<HTMLElement>;

export type RovingIndexElementProps = {
    value: string;
    element: HTMLElement;
};

export type RovingIndexProps = {
    elements: MutableRefObject<Map<string, HTMLElement>>;
    getOrderedItems: () => RovingIndexElementProps[];
    setFocusableValue: (value: string) => void;
    focusableValue: string | null;
    onShiftTab: () => void;
};
