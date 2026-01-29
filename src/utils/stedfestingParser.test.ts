import { describe, expect, test } from 'bun:test'
import { isValidStedfestingInput, parseStedfestingInput, parseStedfestingRanges } from './stedfestingParser'

describe('parseStedfestingInput', () => {
  test('parses mixed stedfesting tokens', () => {
    // Arrange
    const input = '1234, 0.2-0.5@5678, 0.8@9999'

    // Act
    const result = parseStedfestingInput(input)

    // Assert
    expect(result.veglenkesekvensIds).toEqual([1234, 5678, 9999])
    expect(result.stedfestingFilter).toBe('0-1@1234,0.2-0.5@5678,0.8@9999')
  })

  test('deduplicates veglenkesekvens ids and filters', () => {
    // Arrange
    const input = '@1234, 0.2-0.3@1234, 0.2-0.3@1234'

    // Act
    const result = parseStedfestingInput(input)

    // Assert
    expect(result.veglenkesekvensIds).toEqual([1234])
    expect(result.stedfestingFilter).toBe('0-1@1234,0.2-0.3@1234')
  })
})

describe('isValidStedfestingInput', () => {
  test('accepts valid stedfesting expressions', () => {
    // Arrange
    const input = '1234, 0.2-0.5@5678, 0.8@9999'

    // Act
    const result = isValidStedfestingInput(input)

    // Assert
    expect(result).toBe(true)
  })

  test('rejects invalid stedfesting expressions', () => {
    // Arrange
    const input = '0.2-0.5@foo'

    // Act
    const result = isValidStedfestingInput(input)

    // Assert
    expect(result).toBe(false)
  })
})

describe('parseStedfestingRanges', () => {
  test('creates ranges for each token', () => {
    // Arrange
    const input = '1234, 0.2-0.5@5678, 0.8@9999'

    // Act
    const result = parseStedfestingRanges(input)

    // Assert
    expect(result).toEqual([
      { id: 1234, start: 0, end: 1 },
      { id: 5678, start: 0.2, end: 0.5 },
      { id: 9999, start: 0.8, end: 0.8 },
    ])
  })
})
