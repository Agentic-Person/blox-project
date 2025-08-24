# YouTube API Setup Guide

## 🎯 Goal
We need to find the real YouTube video IDs for all 231 videos in our curriculum. The current IDs are fake/placeholder values that don't work.

## 📋 Current Status
✅ **Completed:**
- Installed `googleapis` and `dotenv` packages
- Created `youtube-search-real-videos.js` script
- Added API key placeholders to `.env.local`
- Script is ready to run once API key is added

❌ **Remaining:**
- Get YouTube API key
- Add key to `.env.local`
- Run the search script
- Update curriculum with real video IDs

## 🔑 How to Get YouTube API Key

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project" or select existing
3. Name it something like "Blox-Buddy-YouTube"

### Step 3: Enable YouTube Data API v3
1. Go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "ENABLE"

### Step 4: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API Key"
3. Copy the API key that appears

### Step 5: (Optional) Restrict the Key
1. Click on your API key in the credentials list
2. Under "API restrictions", select "Restrict key"
3. Choose "YouTube Data API v3"
4. Save

## 🔧 Add API Key to Project

Edit `.env.local` and add your key:
```
YOUTUBE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

Example:
```
YOUTUBE_API_KEY=AIzaSyD-9tSrkeXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🚀 Run the Search Script

Once you have the API key in `.env.local`:

```bash
node scripts/youtube-search-real-videos.js
```

## 📊 What the Script Does

1. **Reads** the markdown file with video titles/creators
2. **Searches** YouTube for each video using:
   - Exact title + creator name
   - Fallback to broader search if needed
3. **Checks** if videos are:
   - Public
   - Embeddable
   - Still available
4. **Scores** results based on:
   - Title match accuracy
   - Creator/channel match
   - View count (popularity)
   - Upload date (prefers recent)
5. **Generates**:
   - `youtube-videos-found-[timestamp].json` - All found videos
   - `curriculum-update-[timestamp].json` - Ready to update curriculum
   - `youtube-search-report-[timestamp].md` - Human-readable report

## 🎯 Expected Results

The script will:
- Search all 231 videos
- Find real YouTube IDs for videos that exist
- Report which videos couldn't be found
- Provide alternative options when available
- Show confidence levels (high/medium/low)

## ⚠️ Important Notes

- **API Quota**: YouTube API has 10,000 units/day quota
- **Search Cost**: Each search costs ~100 units
- **We can search**: ~100 videos per day
- **Our needs**: 231 videos (might need 2-3 days)

## 🔄 After Running the Script

1. Review the generated report
2. Check videos marked as "low confidence"
3. Manually verify critical videos (Day 1-10)
4. Update curriculum.json with the found IDs

## 📝 Manual Verification

For videos not found or low confidence, you can:
1. Search YouTube manually
2. Find suitable replacement videos
3. Update the script results

## 🆘 Troubleshooting

**"API key not found"**
- Make sure you added it to `.env.local`
- Check the key name is exactly `YOUTUBE_API_KEY`

**"Quota exceeded"**
- Wait until tomorrow (quota resets daily)
- Or create another project/API key

**"No results found"**
- Video might be deleted
- Try searching with different keywords
- Look for alternative videos on same topic

## 📌 Next Steps After Getting Videos

1. Run the curriculum update script
2. Test videos in the app
3. Replace any remaining broken videos
4. Add fallback videos for each lesson

---

**Ready?** Get your API key and let's find those real videos! 🚀