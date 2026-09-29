import { describe, expect, it } from 'vitest'
import { fetchErrorMessage } from '../../app/utils/loadState'

describe('fetchErrorMessage', () => {
  it('says the subject could not be loaded', () => {
    expect(fetchErrorMessage('the roster')).toBe('Could not load the roster right now.')
  })

  it('words a missing Warcraft Logs connection differently from an outage', () => {
    expect(fetchErrorMessage('this raid', true))
      .toBe('The Warcraft Logs connection is not set up yet, so this raid cannot be shown.')
  })

  it('never uses an em dash', () => {
    for (const notConfigured of [false, true]) {
      expect(fetchErrorMessage('x', notConfigured)).not.toContain('—')
    }
  })
})
