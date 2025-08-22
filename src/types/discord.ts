export interface DiscordGuild {
  id: string
  name: string
  icon?: string
  memberCount: number
  onlineCount: number
  features: string[]
}

export interface DiscordChannel {
  id: string
  name: string
  type: 'text' | 'voice' | 'category'
  topic?: string
  memberCount?: number
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar?: string
  isOnline: boolean
  joinedAt: Date
  roles: DiscordRole[]
}

export interface DiscordRole {
  id: string
  name: string
  color: string
  position: number
  permissions: string[]
}

export interface DiscordMessage {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  timestamp: Date
  channelId: string
  attachments?: DiscordAttachment[]
  embeds?: DiscordEmbed[]
}

export interface DiscordAttachment {
  id: string
  filename: string
  url: string
  size: number
  contentType: string
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: string
  thumbnail?: { url: string }
  image?: { url: string }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
}