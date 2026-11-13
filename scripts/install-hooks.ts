// Points git at the hooks in `.githooks/`, so every clone runs the same pre-commit
// check without anyone having to remember a setup step. Run by npm's `prepare`
// script, which fires after `npm install` and `npm ci`.
//
// It must never fail an install: Cloudflare Pages and CI run `npm ci` too, and an
// install outside a git clone (a tarball, a container without git) has nothing to
// hook. So it skips CI and swallows every error.
import { execFileSync } from 'node:child_process'

if (!process.env.CI) {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' })
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' })
  }
  catch {
    // Not a git clone, or no git: nothing to hook.
  }
}
