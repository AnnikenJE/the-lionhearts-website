// Fails when git tracks an env file. `.gitignore` keeps `.env` and `.env.*` out of a
// plain `git add`, but `git add -f` walks straight past it, and this repository is
// public, so a committed `.env` is a leaked secret. Run by the pre-commit hook in
// `.githooks/` and by CI, so the check lives in one place.
//
// Plain TypeScript that Node 24 runs as is (`node scripts/check-env-files.ts`): no
// build step, no dependencies, which is what lets CI run it before `npm ci`.
import { execFileSync } from 'node:child_process'

/** `.env`, `.env.local`, `.env.production` and so on, in any folder. Not `.envrc`. */
const ENV_FILE = /(^|\/)\.env(\.[^/]*)?$/

/** The template that is meant to be committed, with every value left empty. */
const TEMPLATE = /(^|\/)\.env\.example$/

/** The paths that are env files and not the template. */
export const findEnvFiles = (paths: string[]): string[] =>
  paths.filter(path => ENV_FILE.test(path) && !TEMPLATE.test(path))

if (import.meta.main) {
  // `git ls-files` lists the index, so a file staged a moment ago counts too, which
  // is what makes the same check work before a commit and in CI. `-z` keeps paths
  // with odd characters intact.
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
  const found = findEnvFiles(tracked)

  if (found.length > 0) {
    console.error('These env files are tracked by git and must not be committed:\n')
    for (const path of found) console.error(`  ${path}`)
    console.error('\nUnstage them with `git rm --cached <file>`. If one was already pushed,')
    console.error('treat every secret in it as leaked and rotate it.')
    process.exit(1)
  }
}
