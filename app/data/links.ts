export const DISCORD_URL = 'https://discord.gg/xP488F7yrr'

// The site's contact address: removal requests, questions about the site, and anyone
// outside the guild (Blizzard, Warcraft Logs, Raider.IO) who does not use Discord.
export const CONTACT_EMAIL = 'thelionheartseu@gmail.com'

export interface GuildLink {
  label: string
  url: string
}

export const GUILD_LINKS: GuildLink[] = [
  { label: 'Discord', url: DISCORD_URL },
  { label: 'Raider.IO', url: 'https://raider.io/guilds/eu/darkmoon-faire/The%20Lionhearts' },
  { label: 'Warcraft Logs', url: 'https://www.warcraftlogs.com/guild/eu/darkmoon-faire/the%20lionhearts' },
]
