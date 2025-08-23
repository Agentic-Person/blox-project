'use client'

import { motion } from 'framer-motion'
import { Crown, Shield, Zap, Circle } from 'lucide-react'

interface Member {
  id: string
  username: string
  discriminator: string
  status: 'online' | 'idle' | 'dnd' | 'offline'
  role?: 'owner' | 'admin' | 'moderator' | 'booster' | 'member'
  avatar?: string
}

const mockMembers: Member[] = [
  { id: '1', username: 'BloxMaster', discriminator: '0001', status: 'online', role: 'owner' },
  { id: '2', username: 'ScriptWizard', discriminator: '1337', status: 'online', role: 'admin' },
  { id: '3', username: 'BuilderPro', discriminator: '2024', status: 'idle', role: 'moderator' },
  { id: '4', username: 'NoobHelper', discriminator: '9999', status: 'online', role: 'moderator' },
  { id: '5', username: 'GameDev', discriminator: '4567', status: 'dnd', role: 'booster' },
  { id: '6', username: 'LuaExpert', discriminator: '0042', status: 'online', role: 'member' },
  { id: '7', username: 'TerrainArtist', discriminator: '8888', status: 'online', role: 'member' },
  { id: '8', username: 'UIDesigner', discriminator: '3333', status: 'idle', role: 'member' },
  { id: '9', username: 'Animator', discriminator: '5555', status: 'offline', role: 'member' },
  { id: '10', username: 'SoundGuy', discriminator: '7777', status: 'offline', role: 'member' },
]

export default function DiscordMemberList() {
  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  }

  const roleIcons = {
    owner: Crown,
    admin: Shield,
    moderator: Shield,
    booster: Zap,
    member: null
  }

  const roleColors = {
    owner: 'text-[#FFD700]',
    admin: 'text-[#E74C3C]',
    moderator: 'text-[#3498DB]',
    booster: 'text-[#FF73FA]',
    member: 'text-[#949BA4]'
  }

  // Separate online and offline members
  const onlineMembers = mockMembers.filter(m => m.status !== 'offline')
  const offlineMembers = mockMembers.filter(m => m.status === 'offline')

  const MemberItem = ({ member, index }: { member: Member; index: number }) => {
    const RoleIcon = member.role ? roleIcons[member.role] : null
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        whileHover={{ x: 2 }}
        className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373C] transition-all duration-200 group cursor-pointer"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5865F2] to-[#7289DA] flex items-center justify-center text-white text-xs font-bold">
            {member.username.charAt(0)}
          </div>
          {/* Status Indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[member.status]} border-2 border-[#2B2D31]`} />
        </div>

        {/* Username */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${member.role ? roleColors[member.role] : 'text-[#DBDEE1]'} ${member.status === 'offline' ? 'opacity-50' : ''}`}>
            <span className="flex items-center gap-1">
              {RoleIcon && <RoleIcon className="h-3 w-3" />}
              <span className="truncate">{member.username}</span>
            </span>
          </div>
        </div>

        {/* Hover Actions (mock) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-[#949BA4]">#{member.discriminator}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-xs bg-[#2B2D31] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1E1F22] border-b border-black/20">
        <h3 className="text-sm font-semibold text-[#949BA4]">MEMBER LIST</h3>
      </div>

      {/* Member List */}
      <div className="p-2 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {/* Online Section */}
        <div>
          <div className="px-2 py-1 text-xs font-semibold text-[#949BA4] uppercase">
            Online — {onlineMembers.length}
          </div>
          <div className="space-y-0.5">
            {onlineMembers.map((member, index) => (
              <MemberItem key={member.id} member={member} index={index} />
            ))}
          </div>
        </div>

        {/* Offline Section */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-[#949BA4] uppercase">
              Offline — {offlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {offlineMembers.map((member, index) => (
                <MemberItem key={member.id} member={member} index={onlineMembers.length + index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Server Stats */}
      <div className="px-4 py-3 bg-[#1E1F22] border-t border-black/20">
        <div className="flex justify-between text-xs text-[#949BA4]">
          <span>Total Members</span>
          <span className="font-semibold text-white">{mockMembers.length}</span>
        </div>
        <div className="flex justify-between text-xs text-[#949BA4] mt-1">
          <span>Server Boost</span>
          <span className="font-semibold text-[#FF73FA]">Level 2</span>
        </div>
      </div>
    </div>
  )
}