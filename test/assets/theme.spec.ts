import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../../app/assets/css/main.css', import.meta.url), 'utf-8')

describe('main.css theme tokens', () => {
  it.each([
    ['--color-bg', '#0a0a0a'],
    ['--color-surface', '#121110'],
    ['--color-surface-hover', '#1c1a17'],
    ['--color-line', '#2e2a24'],
    ['--color-line-strong', '#6b6153'],
    ['--color-fg', '#f0e8d8'],
    ['--color-fg-muted', '#c2b9a8'],
    ['--color-fg-subtle', '#938c7c'],
    ['--color-accent', '#d4b67a'],
    ['--color-accent-bright', '#f0ce98'],
    ['--color-accent-ink', '#15110b'],
    ['--color-success', '#8bb97e'],
    ['--color-warning', '#d99642'],
    ['--color-danger', '#cf6354'],
    ['--color-info', '#74a0c0'],
    ['--color-crest', '#7a2a23'],
  ])('%s is %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`)
  })

  it('no longer hardcodes the old accent in ::selection', () => {
    expect(css).not.toContain('rgb(200 169 110')
  })
})
