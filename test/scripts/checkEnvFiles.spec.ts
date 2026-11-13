import { describe, expect, it } from 'vitest'
import { findEnvFiles } from '../../scripts/check-env-files'

describe('findEnvFiles', () => {
  it('finds .env and its variants, at the root and in folders', () => {
    const paths = ['.env', '.env.local', '.env.production', 'server/.env', 'a/b/.env.test']
    expect(findEnvFiles(paths)).toEqual(paths)
  })

  it('lets the committed template through, wherever it is', () => {
    expect(findEnvFiles(['.env.example', 'server/.env.example'])).toEqual([])
  })

  it('ignores files that only start like an env file', () => {
    expect(findEnvFiles(['.envrc', '.environment', 'my.env', 'env', 'docs/.env-notes.md'])).toEqual([])
  })

  it('ignores ordinary files', () => {
    expect(findEnvFiles(['package.json', 'nuxt.config.ts', 'server/utils/warcraftlogs.ts'])).toEqual([])
  })

  it('still flags a variant that only contains the word example', () => {
    expect(findEnvFiles(['.env.example.local'])).toEqual(['.env.example.local'])
  })
})
