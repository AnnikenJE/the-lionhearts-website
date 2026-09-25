// Official WoW class colours. Warcraft Logs returns class names without a
// space ("DeathKnight"), Raider.IO returns them with a space ("Death Knight"),
// so keys are normalised (lowercase, spaces and hyphens stripped) and lookups
// go through the same normalisation, letting classColor serve both sources.
const CLASS_COLORS: Record<string, string> = {
  deathknight: '#c41e3a',
  demonhunter: '#a330c9',
  druid: '#ff7c0a',
  evoker: '#33937f',
  hunter: '#aad372',
  mage: '#3fc7eb',
  monk: '#00ff98',
  paladin: '#f48cba',
  priest: '#ffffff',
  rogue: '#fff468',
  shaman: '#0070dd',
  warlock: '#8788ee',
  warrior: '#c69b6d',
}

/** Returns a CSS colour, so call sites bind it with `:style`, not `:class`. */
export const classColor = (className: string): string =>
  CLASS_COLORS[className.toLowerCase().replace(/[\s-]/g, '')] ?? 'var(--color-fg)'

/**
 * A realm's URL slug, from any of the ways the APIs spell it: Raider.IO says
 * "Defias Brotherhood", a Warcraft Logs player entry says "DefiasBrotherhood", and
 * both become "defias-brotherhood". Apostrophes drop out ("Kel'Thuzad" is
 * "kelthuzad"), which is how Blizzard, Raider.IO and Warcraft Logs all slug them.
 */
export const realmSlug = (realm: string): string =>
  realm
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/'/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

/** The site's own page for a character. */
export const characterPath = (realm: string, name: string): string =>
  `/characters/${realmSlug(realm)}/${encodeURIComponent(name)}`

// The parse colours every WoW raider already reads at a glance, as used by Warcraft
// Logs itself: grey, green, blue, purple, orange, pink, then gold for a perfect 100.
const PARSE_COLORS: [min: number, color: string][] = [
  [100, '#e5cc80'],
  [99, '#e268a8'],
  [95, '#ff8000'],
  [75, '#a335ee'],
  [50, '#0070ff'],
  [25, '#1eff00'],
  [0, '#9d9d9d'],
]

/** Colour for a parse percentile. Returns a CSS colour, bound with `:style`. */
export const parseColor = (percent: number): string =>
  PARSE_COLORS.find(([min]) => Math.floor(percent) >= min)?.[1] ?? '#9d9d9d'

// Blizzard's item quality colours, keyed by the quality integer Raider.IO returns.
const QUALITY_COLORS: Record<number, string> = {
  0: '#9d9d9d',
  1: '#ffffff',
  2: '#1eff00',
  3: '#0070dd',
  4: '#a335ee',
  5: '#ff8000',
  6: '#e6cc80',
  7: '#00ccff',
}

/** Colour for an item quality. Returns a CSS colour, bound with `:style`. */
export const itemQualityColor = (quality: number): string =>
  QUALITY_COLORS[quality] ?? 'var(--color-fg)'

/** An item or ability icon by its game file name, from Wowhead's icon CDN. */
export const iconUrl = (icon: string): string =>
  `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`

export const wowheadItemUrl = (itemId: number): string =>
  `https://www.wowhead.com/item=${itemId}`
