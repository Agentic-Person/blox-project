# Protected Curriculum Backups

## Current Status (2025-08-27)

### PROPER_CURRICULUM_STRUCTURE.json
- **Created**: August 27, 2025
- **Description**: Correct curriculum structure with proper titles, creators, and metadata
- **Videos Status**:
  - ✅ 1 verified working video (BrawlDev tutorial)
  - ✅ 2 Blender videos already correct (Blender Guru, Imphenzia)
  - ⚠️ 3 videos with fake IDs that need replacement
  - 🔍 145 videos with unverified IDs

### Key Points:
1. The curriculum STRUCTURE is correct - all titles, creators, and organization
2. We only need to find/verify real YouTube IDs
3. DO NOT randomly insert videos - each has a specific place
4. The master document contains FAKE YouTube IDs - don't use them

### To Restore:
```bash
cp .protected/PROPER_CURRICULUM_STRUCTURE.json src/data/curriculum.json
```

### Verified Working Videos:
- `9MUgLaF22Yo` - BrawlDev's Roblox Studio Basics Tutorial
- `TPrnSACiTJ4` - Blender Guru's Donut Tutorial
- `Q7AOvWpIVHU` - Imphenzia's 10-minute modeling
- `XY6Ig48tAnk` - AlvinBlox's Tycoon Tutorial (not yet mapped)

### Known Fake IDs (Don't Use):
- `K0lDWlGMK94` - Doesn't exist
- `OYwWs5s1KYY` - Doesn't exist
- `SpvjB0wS3cc` - Doesn't exist
- `AKz_60c2v_A` - Doesn't exist