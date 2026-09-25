// Item upgrade tracks ("Hero 4/6"). Neither Raider.IO nor Warcraft Logs names the
// track; an item only carries bonus ids, and one of them encodes the track and step.
// Raidbots publishes the game's bonus id table as static JSON, and these turn it into
// a small id-to-name lookup. Pure, so it is testable without a Nitro runtime.

interface RaidbotsBonus {
  upgrade?: {
    name?: string
    fullName?: string
    level: number
    max: number
  }
}

/** Bonus id to track name, e.g. 12852 to "Myth 4/6". Ids without a named track are left out. */
export type UpgradeTracks = Record<number, string>

export const toUpgradeTracks = (bonuses: Record<string, RaidbotsBonus>): UpgradeTracks => {
  const tracks: UpgradeTracks = {}

  for (const [id, bonus] of Object.entries(bonuses)) {
    const upgrade = bonus.upgrade
    if (!upgrade?.name) continue
    tracks[Number(id)] = upgrade.fullName ?? `${upgrade.name} ${upgrade.level}/${upgrade.max}`
  }

  return tracks
}

/** The track of an item from its bonus ids, or null for an item that has none (a crafted piece, say). */
export const upgradeTrack = (bonusIds: number[] | undefined, tracks: UpgradeTracks): string | null => {
  for (const id of bonusIds ?? []) {
    if (tracks[id]) return tracks[id]
  }
  return null
}
