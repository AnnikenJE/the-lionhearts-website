// A character can ask to be left off the site. Blizzard's Developer API Terms of
// Use require that removal to be immediate, and it has to hold for every page
// that names a character, so the list lives here rather than in one route.
//
// To remove someone: add their character name to OPTED_OUT and deploy, then delete
// the keys in the CACHE KV namespace, since cached pages still hold their data. The
// name is all that is needed. Every source spells it the way the game does, and a
// character name is unique on a realm, so a name match cannot hit the wrong
// person on Darkmoon Faire.
//
// The list cannot reach text inside an image: if the name is in the group picture on
// the raids page (public/raids-banner-*), blur it in both files as well.

/** Character names that have asked not to appear. Spelling and case do not matter. */
const OPTED_OUT: string[] = [
  // 'Someguy',
]

/**
 * Case-insensitive membership. Separate from the list so the matching can be
 * tested without anyone real having to be in it.
 */
export const isNameIn = (names: readonly string[], name: string): boolean =>
  names.some(entry => entry.toLowerCase() === name.toLowerCase())

/** True when this character has asked not to appear on the site. */
export const isOptedOut = (name: string): boolean => isNameIn(OPTED_OUT, name)

/** Drops every opted-out character from a list of anything with a name. */
export const withoutOptedOut = <T extends { name: string }>(entries: T[]): T[] =>
  entries.filter(entry => !isOptedOut(entry.name))
