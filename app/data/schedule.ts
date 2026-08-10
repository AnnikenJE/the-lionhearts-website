// Raid nights. Edit these to match the guild's actual schedule.
export interface RaidNight {
  day: string
  start: string
  end: string
  timezone: string
  note?: string
}

export const RAID_SCHEDULE: RaidNight[] = [
  { day: 'Wednesday', start: '20:00', end: '23:00', timezone: 'ST' },
  { day: 'Sunday', start: '20:00', end: '23:00', timezone: 'ST', note: 'Progression' },
]
