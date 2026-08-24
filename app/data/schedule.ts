export interface RaidNight {
  day: string
  start: string
  /** Omit if the raid has no fixed end. */
  end?: string
  /**
   * Shown after the times. EU realms run on CET in winter and CEST in summer,
   * so never write a fixed offset like "GMT+2" here: it would be wrong for
   * half the year.
   */
  timezone: string
  note?: string
}

export const RAID_SCHEDULE: RaidNight[] = [
  { day: 'Thursday', start: '19:00', end: '22:00', timezone: 'server time' },
  { day: 'Sunday', start: '19:00', end: '22:00', timezone: 'server time' },
]
