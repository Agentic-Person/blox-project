# Disaster Recovery & Backup Guide
> Complete recovery procedures for the Blox Wizard system

## 🚨 Emergency Contacts & Resources

- **Supabase Status**: https://status.supabase.com
- **OpenAI Status**: https://status.openai.com
- **Vercel Status**: https://vercel-status.com
- **Team Slack**: #blox-emergency
- **On-Call Developer**: Check rotation schedule

## 📊 System Components Priority

| Component | Priority | Recovery Time | Data Loss Tolerance |
|-----------|----------|---------------|-------------------|
| Database | CRITICAL | < 1 hour | 0 hours |
| Transcripts | HIGH | < 4 hours | 24 hours |
| Embeddings | MEDIUM | < 8 hours | Can regenerate |
| Chat History | LOW | < 24 hours | 7 days |
| Analytics | LOW | < 48 hours | 30 days |

## 🔄 Backup Procedures

### 1. Automated Backups

#### Supabase Database
```bash
# Automatic daily backups at 2 AM UTC
# Retained for 30 days
# Access via Supabase Dashboard > Settings > Backups
```

#### Transcript JSON Files
```bash
# Daily export script (add to cron)
0 2 * * * node /path/to/scripts/backup-transcripts.js
```

Create `scripts/backup-transcripts.js`:
```javascript
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function backupTranscripts() {
  const timestamp = new Date().toISOString().split('T')[0]
  const backupDir = path.join(__dirname, '../backups', timestamp)
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true })
  
  // Fetch all transcripts
  const { data: transcripts } = await supabase
    .from('video_transcripts')
    .select('*')
  
  // Save to file
  fs.writeFileSync(
    path.join(backupDir, 'transcripts.json'),
    JSON.stringify(transcripts, null, 2)
  )
  
  // Fetch all chunks
  const { data: chunks } = await supabase
    .from('transcript_chunks')
    .select('*')
  
  fs.writeFileSync(
    path.join(backupDir, 'chunks.json'),
    JSON.stringify(chunks, null, 2)
  )
  
  console.log(`Backup completed: ${backupDir}`)
}

backupTranscripts()
```

### 2. Manual Backup Commands

#### Export Database
```bash
# Full database export
pg_dump postgresql://[CONNECTION_STRING] > backup_$(date +%Y%m%d).sql

# Specific tables only
pg_dump -t video_transcripts -t transcript_chunks [CONNECTION] > transcripts_backup.sql
```

#### Export Embeddings
```bash
# Export embeddings to binary format
psql [CONNECTION] -c "\COPY (SELECT id, embedding FROM transcript_chunks) TO 'embeddings.bin' WITH BINARY"
```

#### Backup Environment Variables
```bash
# Encrypt and backup .env files
tar -czf - .env .env.local | openssl enc -aes-256-cbc -salt -out env_backup.tar.gz.enc
```

## 🛠️ Recovery Procedures

### Scenario 1: Database Corruption/Loss

#### Step 1: Assess Damage
```bash
# Check database connectivity
psql [CONNECTION] -c "SELECT 1"

# Check table integrity
psql [CONNECTION] -c "SELECT COUNT(*) FROM video_transcripts"
psql [CONNECTION] -c "SELECT COUNT(*) FROM transcript_chunks"
```

#### Step 2: Restore from Supabase Backup
1. Go to Supabase Dashboard
2. Navigate to Settings > Backups
3. Select most recent backup
4. Click "Restore" 
5. Wait for restoration (15-30 minutes)

#### Step 3: Restore from Manual Backup (if needed)
```bash
# Restore full database
psql [CONNECTION] < backup_20250901.sql

# Restore specific tables
psql [CONNECTION] < transcripts_backup.sql
```

#### Step 4: Verify Restoration
```bash
node scripts/verify-restoration.js
```

Create `scripts/verify-restoration.js`:
```javascript
async function verifyRestoration() {
  const checks = [
    { table: 'video_transcripts', minCount: 20 },
    { table: 'transcript_chunks', minCount: 100 },
    { table: 'admin_users', minCount: 1 },
  ]
  
  for (const check of checks) {
    const { count } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true })
    
    if (count < check.minCount) {
      console.error(`❌ ${check.table}: ${count} (expected >= ${check.minCount})`)
    } else {
      console.log(`✅ ${check.table}: ${count} records`)
    }
  }
}
```

### Scenario 2: Transcript Extraction Failure

#### Step 1: Identify Failed Videos
```sql
SELECT youtube_id, title, attempts, error_message 
FROM video_queue 
WHERE status IN ('failed', 'retry')
ORDER BY priority DESC, created_at ASC;
```

#### Step 2: Reset Failed Videos
```sql
UPDATE video_queue 
SET status = 'pending', attempts = 0, error_message = NULL
WHERE status = 'failed' AND attempts < 3;
```

#### Step 3: Manual Re-extraction
```bash
# Single video
python scripts/extract-transcripts.py YOUTUBE_ID

# Batch re-extraction
node scripts/reprocess-failed-videos.js
```

### Scenario 3: Embedding Generation Failure

#### Step 1: Identify Missing Embeddings
```sql
SELECT COUNT(*) FROM transcript_chunks WHERE embedding IS NULL;
```

#### Step 2: Regenerate Embeddings
```javascript
// scripts/regenerate-embeddings.js
const { data: chunks } = await supabase
  .from('transcript_chunks')
  .select('id, chunk_text')
  .is('embedding', null)

for (const chunk of chunks) {
  const embedding = await generateEmbedding(chunk.chunk_text)
  
  await supabase
    .from('transcript_chunks')
    .update({ embedding })
    .eq('id', chunk.id)
}
```

### Scenario 4: API Keys Compromised

#### Immediate Actions
1. **Revoke all API keys immediately**
2. **Generate new keys**
3. **Update environment variables**
4. **Restart all services**
5. **Audit access logs**

#### OpenAI API Key
```bash
# 1. Go to https://platform.openai.com/api-keys
# 2. Delete compromised key
# 3. Create new key
# 4. Update .env file
OPENAI_API_KEY=sk-proj-NEW_KEY_HERE

# 5. Restart application
npm run build && npm run start
```

#### Supabase Keys
```bash
# 1. Go to Supabase Dashboard > Settings > API
# 2. Regenerate anon key
# 3. Regenerate service role key
# 4. Update environment variables
NEXT_PUBLIC_SUPABASE_ANON_KEY=NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_KEY

# 5. Redeploy application
vercel --prod
```

### Scenario 5: Complete System Failure

#### Recovery Checklist
- [ ] Verify hosting platform status (Vercel)
- [ ] Check domain DNS configuration
- [ ] Verify SSL certificates
- [ ] Test database connectivity
- [ ] Verify API endpoints
- [ ] Check environment variables
- [ ] Test authentication flow
- [ ] Verify chat functionality
- [ ] Check admin dashboard access
- [ ] Monitor error logs

#### Full System Restoration
```bash
# 1. Clone repository
git clone https://github.com/your-org/blox-buddy.git
cd blox-buddy

# 2. Install dependencies
npm install

# 3. Restore environment variables
openssl enc -aes-256-cbc -d -in env_backup.tar.gz.enc | tar -xzf -

# 4. Restore database
psql [CONNECTION] < full_backup.sql

# 5. Regenerate missing data
node scripts/import-real-transcripts.js

# 6. Deploy
vercel --prod
```

## 📋 Recovery Validation Checklist

### Database Validation
```sql
-- Check record counts
SELECT 
  (SELECT COUNT(*) FROM video_transcripts) as transcripts,
  (SELECT COUNT(*) FROM transcript_chunks) as chunks,
  (SELECT COUNT(*) FROM admin_users) as admins,
  (SELECT COUNT(*) FROM video_queue) as queue_items;

-- Check vector search
SELECT COUNT(*) FROM transcript_chunks 
WHERE embedding IS NOT NULL;

-- Test search function
SELECT * FROM search_transcript_chunks(
  (SELECT embedding FROM transcript_chunks LIMIT 1),
  0.7, 5
);
```

### API Validation
```bash
# Test Chat API
curl -X POST http://localhost:3000/api/chat/blox-wizard \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test-123"}'

# Test Admin API
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Frontend Validation
1. Load homepage
2. Test chat interface
3. Check video references
4. Test admin login
5. Verify dashboard data
6. Test video management

## 🔐 Security Post-Recovery

### Audit Checklist
- [ ] Change all passwords
- [ ] Rotate all API keys
- [ ] Review access logs
- [ ] Check for unauthorized changes
- [ ] Update security headers
- [ ] Test rate limiting
- [ ] Verify CORS settings
- [ ] Check RLS policies

### Monitor for 48 Hours
```javascript
// Add temporary monitoring
setInterval(async () => {
  const health = await checkSystemHealth()
  if (!health.ok) {
    await notifyTeam(health.issues)
  }
}, 60000) // Every minute
```

## 📞 Escalation Procedures

### Level 1: Developer On-Call
- Response time: 15 minutes
- Can handle: Most recovery scenarios
- Escalates to: Level 2 if database corruption

### Level 2: Senior Developer
- Response time: 30 minutes
- Can handle: Database restoration, API issues
- Escalates to: Level 3 if data loss

### Level 3: Team Lead + Stakeholders
- Response time: 1 hour
- Can handle: Business decisions, communication
- Escalates to: External support if needed

## 📝 Post-Incident Procedures

### Documentation Required
1. **Incident Report** (within 24 hours)
   - Timeline of events
   - Root cause analysis
   - Actions taken
   - Lessons learned

2. **Recovery Metrics**
   - Time to detection
   - Time to resolution
   - Data loss (if any)
   - User impact

3. **Process Improvements**
   - What went well
   - What needs improvement
   - Action items with owners
   - Implementation timeline

### Template: Incident Report
```markdown
# Incident Report: [DATE]

## Summary
- **Severity**: Critical/High/Medium/Low
- **Duration**: X hours Y minutes
- **Impact**: X users affected

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - System verified

## Root Cause
[Detailed explanation]

## Resolution
[Steps taken to resolve]

## Prevention
[Steps to prevent recurrence]

## Action Items
- [ ] Action 1 - Owner - Due date
- [ ] Action 2 - Owner - Due date
```

## 🔄 Regular Disaster Recovery Drills

### Monthly Drill Schedule
- **Week 1**: Backup verification
- **Week 2**: Restore test (staging)
- **Week 3**: API key rotation
- **Week 4**: Full recovery drill

### Drill Checklist
```bash
# 1. Create test environment
npm run create-test-env

# 2. Simulate failure
npm run simulate-failure --type=database

# 3. Execute recovery
npm run recover --scenario=database

# 4. Validate recovery
npm run validate-recovery

# 5. Document results
npm run generate-drill-report
```

---

**Remember**: The best disaster recovery is disaster prevention. Regular backups, monitoring, and drills are essential!

**Last Updated**: September 2025
**Next Review**: October 2025
**Owner**: DevOps Team