# 📚 Curriculum Management Workflow

This document explains how to manage and edit the Blox Buddy learning curriculum using our bidirectional conversion system.

## 🎯 Overview

The curriculum management system provides an easy way to:
- Edit video content in readable Markdown format
- Automatically convert between JSON and Markdown
- Validate curriculum structure
- Track changes with automatic backups
- Maintain data integrity

## 📁 File Structure

```
BloxProject/
├── src/data/
│   └── curriculum.json          # Main curriculum data (used by app)
├── docs/
│   ├── curriculum-editable.md   # Human-readable format for editing
│   └── curriculum-workflow.md   # This documentation
└── scripts/curriculum-tools/
    ├── json-to-markdown.js      # JSON → Markdown converter
    ├── markdown-to-json.js      # Markdown → JSON converter
    ├── validate-curriculum.js   # Structure validator
    └── backup-curriculum.js     # Backup utility
```

## 🚀 Quick Start

### 1. **Edit Curriculum Content**
```bash
# Convert JSON to editable Markdown
npm run curriculum:edit

# Edit the generated file
# Open: docs/curriculum-editable.md

# Convert back to JSON after editing
npm run curriculum:save
```

### 2. **Validate Changes**
```bash
# Check curriculum structure and content
npm run curriculum:validate
```

### 3. **Create Backups**
```bash
# Create a timestamped backup
npm run curriculum:backup

# List all backups
npm run curriculum:backup -- --list
```

## 📝 Editing the Curriculum

### Markdown Format

The curriculum is organized hierarchically in the Markdown file:

```markdown
# 📚 Module 1: Modern Foundations & 3D Introduction
**Description:** Master Roblox Studio 2024, Blender 4.1+, and AI tools

## 📅 Week 1: Roblox Studio 2024 Basics
> Navigate the new Creator Hub and master the modern Studio interface

### 🎯 Day 1: New Creator Hub & Studio Interface Part 1
**Practice Task:** Navigate and customize your Roblox Studio workspace
**Estimated Time:** 2h

| # | Title | Creator | Duration | XP | YouTube ID | Status |
|---|-------|---------|----------|----|-----------:|--------|
| 1 | Roblox Studio 2024 Complete Beginner Guide | TheDevKing | 10:00 | 20 | FmD9WwMaMOo | ✅ |
| 2 | New Creator Hub Tutorial 2024 | BrawlDev | 10:00 | 20 | 9MUgLaF22Yo | ✅ |
```

### Status Icons

- ✅ **Valid** - Video has proper YouTube ID and is ready
- ⚠️ **Needs Review** - Video has issues but might work
- ❌ **Missing** - Video needs a YouTube ID
- 🔄 **Substitute** - Video was replaced with an alternative

### Common Editing Tasks

#### **Add a New Video**
1. Add a new row to any video table:
   ```markdown
   | 4 | New Video Title | Creator Name | 8:30 | 25 | dQw4w9WgXcQ | ✅ |
   ```

#### **Replace a Video**
1. Update the YouTube ID in the table:
   ```markdown
   # Before
   | 2 | Old Video | Creator | 10:00 | 20 | YOUTUBE_ID_PLACEHOLDER | ❌ |
   
   # After  
   | 2 | New Video Title | New Creator | 12:30 | 20 | newYouTubeId | ✅ |
   ```

#### **Reorder Videos**
1. Simply move table rows up or down
2. The numbering in the first column can stay the same or be updated

#### **Remove a Video**
1. Delete the entire table row

#### **Change Video Metadata**
- **Title**: Edit the Title column
- **Creator**: Edit the Creator column  
- **Duration**: Format as `MM:SS` or `HH:MM:SS`
- **XP**: Typically 20-25 points per video
- **YouTube ID**: 11-character YouTube video ID

## 🔧 Available Commands

### Core Workflow Commands

| Command | Description |
|---------|-------------|
| `npm run curriculum:edit` | Convert curriculum.json to editable Markdown |
| `npm run curriculum:save` | Convert edited Markdown back to curriculum.json |
| `npm run curriculum:validate` | Validate structure and find issues |
| `npm run curriculum:backup` | Create timestamped backup |

### Advanced Usage

```bash
# Custom file paths
node scripts/curriculum-tools/json-to-markdown.js input.json output.md
node scripts/curriculum-tools/markdown-to-json.js input.md output.json

# Backup specific file
node scripts/curriculum-tools/backup-curriculum.js custom-curriculum.json

# List all backups
npm run curriculum:backup -- --list

# Validate specific file
node scripts/curriculum-tools/validate-curriculum.js custom-curriculum.json
```

## 📊 Understanding Validation

The validation script checks for:

### **Errors** (Must Fix)
- Missing required fields (id, title, creator)
- Invalid YouTube ID format
- Duplicate IDs across curriculum
- Missing or invalid module/week/day structure

### **Warnings** (Should Review)
- Videos with placeholder YouTube IDs
- Missing descriptions
- Unusual XP rewards (outside 1-100 range)
- Days with no videos or too many videos (>10)
- Missing thumbnails

### **Example Validation Output**
```
✅ Validation Status: PASSED
📊 Curriculum Statistics
   Total Videos: 578
   Valid Videos: 331
   Placeholder Videos: 246
   Missing Thumbnails: 247
```

## 🔄 Typical Workflow

### **Weekly Content Updates**
1. **Start with backup**: `npm run curriculum:backup`
2. **Convert to Markdown**: `npm run curriculum:edit`
3. **Edit content**: Open `docs/curriculum-editable.md`
4. **Save changes**: `npm run curriculum:save`
5. **Validate**: `npm run curriculum:validate`
6. **Test in app**: Restart development server

### **Major Restructuring**
1. **Create backup**: `npm run curriculum:backup`
2. **Validate current state**: `npm run curriculum:validate`
3. **Edit in Markdown**: Make changes in `curriculum-editable.md`
4. **Convert back**: `npm run curriculum:save`
5. **Validate changes**: `npm run curriculum:validate`
6. **Fix any errors**: Repeat edit → save → validate cycle
7. **Test thoroughly**: Check app functionality

## ⚠️ Important Notes

### **Data Safety**
- Always create backups before major changes
- The conversion creates automatic backups of `curriculum.json`
- Keep the Markdown file's table formatting intact
- Don't edit `curriculum.json` directly while using this workflow

### **YouTube IDs**
- Must be exactly 11 characters (e.g., `dQw4w9WgXcQ`)
- Can extract from full URLs: `https://youtube.com/watch?v=dQw4w9WgXcQ`
- Use `YOUTUBE_ID_PLACEHOLDER` for missing videos
- Invalid IDs will cause validation errors

### **Table Formatting**
- Keep the pipe `|` separators aligned
- Don't change the header row: `| # | Title | Creator | Duration | XP | YouTube ID | Status |`
- Maintain the separator row: `|---|-------|---------|----------|----|-----------:|--------|`

### **XP and Duration**
- XP typically ranges from 20-25 per video
- Duration format: `MM:SS` (e.g., `10:30`) or `HH:MM:SS`
- Use realistic estimates for video length

## 🐛 Troubleshooting

### **"Table formatting incorrect"**
- Check that all rows have the same number of `|` separators
- Ensure header and separator rows are intact
- Look for missing or extra pipe characters

### **"Invalid YouTube ID format"**
- YouTube IDs must be exactly 11 characters
- Don't include full URLs in the ID column
- Use `YOUTUBE_ID_PLACEHOLDER` for missing videos

### **"Duplicate ID found"**  
- Each video, day, week, and module needs a unique ID
- The conversion automatically generates IDs, but conflicts can occur
- Check the validation report for specific duplicate locations

### **"Conversion failed"**
- Ensure the Markdown file hasn't been corrupted
- Check that required sections (modules, weeks, days) are present
- Verify table structure is intact

## 📈 Statistics Tracking

The system tracks comprehensive statistics:

- **Content Counts**: Modules, weeks, days, videos
- **Quality Metrics**: Valid videos, placeholders, substitutes
- **Data Integrity**: Duplicate IDs, missing thumbnails
- **Progress Tracking**: XP totals, estimated hours

Check stats with: `npm run curriculum:validate`

## 💡 Best Practices

1. **Edit in small batches** - Don't change everything at once
2. **Validate frequently** - Run validation after each major change
3. **Use descriptive commit messages** - Track curriculum changes in git
4. **Test in development** - Verify changes work in the app
5. **Document changes** - Note major modifications in git commits
6. **Keep backups** - Don't rely solely on automatic backups

## 🆘 Recovery Procedures

### **Restore from Backup**
```bash
# List available backups
npm run curriculum:backup -- --list

# Copy specific backup (replace with actual filename)
cp src/data/curriculum-backup-2025-08-30T10-30-00.json src/data/curriculum.json
```

### **Fix Corrupted Markdown**
```bash
# Regenerate from current JSON
npm run curriculum:edit

# This overwrites curriculum-editable.md with clean version
```

### **Emergency Recovery**
If everything breaks, you can always:
1. Use git to revert: `git checkout HEAD -- src/data/curriculum.json`
2. Restore from the most recent backup in `src/data/`
3. Regenerate Markdown: `npm run curriculum:edit`

---

## 📞 Need Help?

If you encounter issues:
1. Check the validation output first: `npm run curriculum:validate`
2. Look at the troubleshooting section above
3. Try regenerating the Markdown: `npm run curriculum:edit`
4. Create an issue with specific error messages and steps to reproduce

**Happy curriculum editing! 🎉**