'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search, Filter, X, Users, Trophy, Target,
  Clock, Shield, Star, TrendingUp, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamFiltersProps {
  onFilterChange?: (filters: TeamFilterState) => void
  onSearchChange?: (search: string) => void
}

export interface TeamFilterState {
  recruitmentStatus: ('open' | 'selective' | 'closed')[]
  teamType: ('casual' | 'competitive' | 'learning')[]
  skills: string[]
  teamSize: 'small' | 'medium' | 'large' | 'all'
  sortBy: 'newest' | 'oldest' | 'members' | 'projects' | 'points' | 'name'
}

const availableSkills = [
  'Scripting', 'Building', 'UI Design', 'Game Design',
  'Animation', 'Art', 'Leadership', 'Marketing',
  'Sound Design', 'Testing', 'Project Management'
]

export default function TeamFilters({ onFilterChange, onSearchChange }: TeamFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<TeamFilterState>({
    recruitmentStatus: [],
    teamType: [],
    skills: [],
    teamSize: 'all',
    sortBy: 'newest'
  })

  const handleFilterChange = (key: keyof TeamFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const toggleArrayFilter = (key: 'recruitmentStatus' | 'teamType' | 'skills', value: string) => {
    const current = filters[key] as string[]
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    handleFilterChange(key, newValue)
  }

  const clearFilters = () => {
    const defaultFilters: TeamFilterState = {
      recruitmentStatus: [],
      teamType: [],
      skills: [],
      teamSize: 'all',
      sortBy: 'newest'
    }
    setFilters(defaultFilters)
    onFilterChange?.(defaultFilters)
  }

  const activeFilterCount = 
    filters.recruitmentStatus.length + 
    filters.teamType.length + 
    filters.skills.length + 
    (filters.teamSize !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'newest' ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-medium-blue-gray" />
                <input
                  type="text"
                  placeholder="Search teams by name, skills, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    onSearchChange?.(e.target.value)
                  }}
                  className="w-full bg-blox-black-blue border border-blox-medium-blue-gray rounded-lg pl-10 pr-4 py-2 text-blox-white placeholder-blox-medium-blue-gray focus:outline-none focus:border-blox-teal focus:ring-1 focus:ring-blox-teal"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="relative"
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blox-purple rounded-full text-xs text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-blox-medium-blue-gray hover:text-blox-white"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6 space-y-6">
                {/* Recruitment Status */}
                <div>
                  <h3 className="text-sm font-medium text-blox-white mb-3">Recruitment Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={filters.recruitmentStatus.includes('open') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.recruitmentStatus.includes('open')
                          ? 'bg-green-500 text-white border-green-500'
                          : 'hover:bg-green-500/20 hover:border-green-500'
                      }`}
                      onClick={() => toggleArrayFilter('recruitmentStatus', 'open')}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Open
                    </Badge>
                    <Badge
                      variant={filters.recruitmentStatus.includes('selective') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.recruitmentStatus.includes('selective')
                          ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'hover:bg-yellow-500/20 hover:border-yellow-500'
                      }`}
                      onClick={() => toggleArrayFilter('recruitmentStatus', 'selective')}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Selective
                    </Badge>
                    <Badge
                      variant={filters.recruitmentStatus.includes('closed') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.recruitmentStatus.includes('closed')
                          ? 'bg-red-500 text-white border-red-500'
                          : 'hover:bg-red-500/20 hover:border-red-500'
                      }`}
                      onClick={() => toggleArrayFilter('recruitmentStatus', 'closed')}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Closed
                    </Badge>
                  </div>
                </div>

                {/* Team Type */}
                <div>
                  <h3 className="text-sm font-medium text-blox-white mb-3">Team Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={filters.teamType.includes('casual') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.teamType.includes('casual')
                          ? 'bg-blox-teal text-white border-blox-teal'
                          : 'hover:bg-blox-teal/20 hover:border-blox-teal'
                      }`}
                      onClick={() => toggleArrayFilter('teamType', 'casual')}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Casual
                    </Badge>
                    <Badge
                      variant={filters.teamType.includes('competitive') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.teamType.includes('competitive')
                          ? 'bg-blox-purple text-white border-blox-purple'
                          : 'hover:bg-blox-purple/20 hover:border-blox-purple'
                      }`}
                      onClick={() => toggleArrayFilter('teamType', 'competitive')}
                    >
                      <Trophy className="h-3 w-3 mr-1" />
                      Competitive
                    </Badge>
                    <Badge
                      variant={filters.teamType.includes('learning') ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        filters.teamType.includes('learning')
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'hover:bg-blue-500/20 hover:border-blue-500'
                      }`}
                      onClick={() => toggleArrayFilter('teamType', 'learning')}
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Learning
                    </Badge>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-sm font-medium text-blox-white mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <Badge
                        key={skill}
                        variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          filters.skills.includes(skill)
                            ? 'bg-blox-glass-teal text-white border-blox-teal'
                            : 'hover:bg-blox-glass-teal/50 hover:border-blox-teal'
                        }`}
                        onClick={() => toggleArrayFilter('skills', skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <h3 className="text-sm font-medium text-blox-white mb-3">Team Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Sizes', icon: Users },
                      { value: 'small', label: 'Small (2-3)', icon: Users },
                      { value: 'medium', label: 'Medium (4-6)', icon: Users },
                      { value: 'large', label: 'Large (7+)', icon: Users }
                    ].map(size => (
                      <Badge
                        key={size.value}
                        variant={filters.teamSize === size.value ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          filters.teamSize === size.value
                            ? 'bg-blox-medium-blue-gray text-white'
                            : 'hover:bg-blox-medium-blue-gray/20'
                        }`}
                        onClick={() => handleFilterChange('teamSize', size.value)}
                      >
                        <size.icon className="h-3 w-3 mr-1" />
                        {size.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="text-sm font-medium text-blox-white mb-3">Sort By</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'newest', label: 'Newest First', icon: Clock },
                      { value: 'oldest', label: 'Oldest First', icon: Clock },
                      { value: 'members', label: 'Most Members', icon: Users },
                      { value: 'projects', label: 'Most Projects', icon: Target },
                      { value: 'points', label: 'Most Points', icon: Star },
                      { value: 'name', label: 'Alphabetical', icon: TrendingUp }
                    ].map(sort => (
                      <Badge
                        key={sort.value}
                        variant={filters.sortBy === sort.value ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all ${
                          filters.sortBy === sort.value
                            ? 'bg-blox-medium-blue-gray text-white'
                            : 'hover:bg-blox-medium-blue-gray/20'
                        }`}
                        onClick={() => handleFilterChange('sortBy', sort.value)}
                      >
                        <sort.icon className="h-3 w-3 mr-1" />
                        {sort.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}