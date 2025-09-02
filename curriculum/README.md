# 📚 Curriculum Management Center

This folder contains **ALL** curriculum-related files organized for easy management and development.

## 📁 Folder Structure

### `/golden/` - 🔒 Protected Working Versions
- `curriculum-weeks1-2-golden.json` - **LOCKED** working curriculum with Weeks 1-2
- `README.md` - Usage guidelines for golden files
- **⚠️ DO NOT MODIFY** - These are read-only reference copies

### `/docs/` - 📝 All Curriculum Documentation  
- `MASTER-CURRICULUM-WEEKS-1-2.md` - **LOCKED** documentation for Weeks 1-2
- `blox-updated-youtube-curriculum.md` - Main 6-month YouTube curriculum plan
- `curriculum-workflow.md` - How to edit and manage curriculum
- `masterDocs/` - Master documentation and video lists
- `youtube/` - YouTube-specific documentation
- All other curriculum markdown files

### `/scripts/` - 🛠️ Curriculum Development Tools
- `curriculum-tools/` - JSON/Markdown conversion tools
- `*youtube*.js` - YouTube API and video processing scripts  
- `*curriculum*.js` - Curriculum validation and update scripts
- All curriculum-related automation scripts

### `/backups/` - 💾 Curriculum Backup Files
- All `curriculum-backup-*.json` files
- `missing-videos-*.json` - Video finding reports
- `substitute-videos-log.json` - Video replacement logs
- Historical curriculum versions

### `/workspace/` - 🚧 Working Files
- Temporary files during curriculum editing
- Generated files from conversion scripts
- Work-in-progress curriculum versions

## 🚀 Quick Start Guide

### Editing Curriculum (Safe Method)
```bash
# 1. Create backup
cp src/data/curriculum.json curriculum/backups/curriculum-backup-$(date +%Y%m%d-%H%M%S).json

# 2. Convert to editable markdown (if script exists)
# npm run curriculum:edit

# 3. Edit the markdown file
# Edit: curriculum/workspace/curriculum-editable.md

# 4. Convert back to JSON (if script exists)  
# npm run curriculum:save

# 5. Validate changes
# npm run curriculum:validate
```

### Golden File Usage
- **Reference**: Use golden files to see what structure WORKS
- **Restore**: Copy golden files over broken curriculum  
- **Backup**: Always backup before major changes

## 🔧 Current Status

### ✅ WEEKS 1-2: LOCKED & WORKING
- Week 1: SmartyRBX Roblox Studio tutorials (5 days)
- Week 2: CG Cookie Blender 4.5 Basics (5 days)  
- Assignment card with custom thumbnails in Day 1
- All YouTube IDs verified and working

### 🚧 WEEKS 3-24: IN DEVELOPMENT
- 160+ placeholder videos need real YouTube IDs
- Structure is complete, content needs refinement
- Use workflow tools to safely edit remaining weeks

## 📋 Development Rules

### ✅ CAN CHANGE:
- Video titles, creators, descriptions
- YouTube IDs (replace placeholders)
- XP rewards and practice tasks

### ❌ CANNOT CHANGE:
- Module/Week/Day structure (6 modules, 24 weeks, 120 days)
- Module/Week/Day IDs
- Weeks 1-2 (protected)

## 🎯 Next Steps

1. **Lock Weeks 1-2**: ✅ Complete
2. **Set up workflow tools**: Validate scripts exist and work
3. **Replace placeholders**: Week by week, validate each change
4. **Test thoroughly**: Each week before moving to next
5. **Document changes**: Keep log of what/why changed

---

**⚠️ IMPORTANT**: Always use the tools and workflows in this folder. Don't edit curriculum directly in `src/data/` without proper backups and validation.