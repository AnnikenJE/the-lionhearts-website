// Raid nights. Edit these to match the guild's actual schedule.
export interface RaidNight {
  day: string
  start: string
  /** Optional end time. Omit if the raid has no fixed end. */
  end?: string
  timezone: string
  note?: string
}

export const RAID_SCHEDULE: RaidNight[] = [
  { day: 'Thursday', start: '19:00', timezone: 'Oslo time' },
  { day: 'Sunday', start: '19:00', timezone: 'Oslo time' },
]
