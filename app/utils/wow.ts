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
