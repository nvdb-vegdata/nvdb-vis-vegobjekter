/**
 * Root test-id for en komponent. Brukes til å generere data-test-id på rot og parts.
 */
export interface WithTestId {
  /**
   * Rotverdi for data-testid, f.eks. testId="accordion" → data-testid="accordion".
   * Konsument må sende unik verdi i repeterte lister.
   */
  testId?: string
}
