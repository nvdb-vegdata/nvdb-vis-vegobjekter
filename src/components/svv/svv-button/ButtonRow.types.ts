import type { PropsWithChildren } from 'react'
import type { WithTestId } from '../svv-testid'

export type ButtonRowType = {
  isFormRow?: boolean
} & PropsWithChildren &
  WithTestId
