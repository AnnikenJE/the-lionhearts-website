import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../../app/utils/contrast'

describe('contrastRatio', () => {
  it('is 1 for identical colours', () => {
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 5)
  })

  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#0a0a0a', '#f0e8d8')).toBeCloseTo(contrastRatio('#f0e8d8', '#0a0a0a'), 10)
  })
})

describe('the design system palette (#54)', () => {
  const TOKENS = {
    bg: '#0a0a0a',
    surface: '#121110',
    surfaceHover: '#1c1a17',
    lineStrong: '#6b6153',
    fg: '#f0e8d8',
    fgMuted: '#c2b9a8',
    fgSubtle: '#938c7c',
    accent: '#d4b67a',
    accentInk: '#15110b',
    success: '#8bb97e',
    warning: '#d99642',
    danger: '#cf6354',
    info: '#74a0c0',
  } as const
  const AA_TEXT = 4.5
  const AA_UI = 3

  it.each([
    ['fg', 'bg'], ['fgMuted', 'bg'], ['fgSubtle', 'bg'], ['fgSubtle', 'surface'],
    ['accent', 'bg'], ['accentInk', 'accent'],
    ['success', 'bg'], ['success', 'surface'], ['success', 'surfaceHover'],
    ['warning', 'bg'], ['warning', 'surface'], ['warning', 'surfaceHover'],
    ['danger', 'bg'], ['danger', 'surface'], ['danger', 'surfaceHover'],
    ['info', 'bg'], ['info', 'surface'], ['info', 'surfaceHover'],
    // surface-hover and line-strong are also used as backgrounds (ROW_LINK,
    // BUTTON_SECONDARY, the roster Clear button), not just as the `surface`/
    // `line` roles their names suggest.
    ['fg', 'surfaceHover'], ['fgMuted', 'surfaceHover'], ['fgSubtle', 'surfaceHover'],
    ['fg', 'lineStrong'],
  ] as const)('%s on %s passes AA for text (4.5:1)', (a, b) => {
    expect(contrastRatio(TOKENS[a], TOKENS[b])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each([
    ['lineStrong', 'surface'], ['lineStrong', 'bg'],
  ] as const)('%s on %s passes AA for a UI boundary (3:1)', (a, b) => {
    expect(contrastRatio(TOKENS[a], TOKENS[b])).toBeGreaterThanOrEqual(AA_UI)
  })
})
