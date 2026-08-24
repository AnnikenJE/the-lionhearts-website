export const DISCORD_URL = 'https://discord.gg/dVWddC6aq'

export interface GuildLink {
  label: string
  url: string
  description?: string
}

export const GUILD_LINKS: GuildLink[] = [
  { label: 'Discord', url: DISCORD_URL, description: 'Guild chat & voice' },
  { label: 'Raider.IO', url: 'https://raider.io/guilds/eu/darkmoon-faire/The%20Lionhearts', description: 'Progression & M+' },
  { label: 'Warcraft Logs', url: 'https://www.warcraftlogs.com/guild/eu/darkmoon-faire/the%20lionhearts', description: 'Raid parses' },
]
