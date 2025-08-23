# BLOX Token Implementation Plan
## Solana Blockchain Integration for Blox Buddy

### 📋 Overview
The BLOX token is the native cryptocurrency of the Blox Buddy ecosystem, built on the Solana blockchain. It serves as both a reward mechanism for learning progress and a utility token for accessing premium features within the platform.

### 🎯 Core Objectives
1. **Incentivize Learning** - Reward users with BLOX tokens for completing educational content
2. **Create Value** - Provide real utility within the Blox Buddy ecosystem
3. **Build Community** - Enable peer-to-peer rewards and collaboration incentives
4. **Future Integration** - Establish foundation for Blox Code Assistant payments

---

## 🏗️ Implementation Phases

### Phase 1: Wallet Integration UI
**Timeline: Day 1**

#### Components to Create:
- `components/wallet/WalletButton.tsx` - Main wallet connection button
- `components/wallet/WalletBalance.tsx` - Real-time balance display
- `components/wallet/WalletModal.tsx` - Wallet selection modal
- `components/wallet/CustodialWallet.tsx` - Supabase-managed wallet component

#### Features:
- **Dual Wallet System**:
  - **Custodial Wallet** (Default): Supabase-managed for new users
  - **Non-Custodial Wallet** (Optional): User's own Phantom/Solflare/etc
- **Progressive Web3 Onboarding**: Start with custodial, upgrade to self-custody later
- **Connection States**: Disconnected, Connecting, Connected, Error
- **Balance Display**: Show both XP and BLOX tokens
- **Network Indicator**: Mainnet/Devnet/Testnet status
- **Position**: Header top-right, next to user menu

#### Technical Requirements:
```typescript
// Hybrid wallet system
- Supabase Auth for account creation
- Automatic custodial wallet generation
- Optional self-custody wallet connection
- Seamless balance migration
- Error handling
```

---

### Phase 1.5: Supabase Custodial Wallet System
**Timeline: Day 1-2**

#### Overview: Web2 to Web3 Bridge
Create a seamless onboarding experience where users can start earning BLOX tokens immediately without understanding crypto wallets. Supabase manages wallets server-side until users are ready for self-custody.

#### How It Works:

##### 1. **User Registration Flow**
```mermaid
User Signs Up → Supabase Auth → Auto-Generate Wallet → Start Earning
     ↓               ↓                    ↓                  ↓
   Email/Pass    User Profile      Custodial Keys       BLOX Tokens
```

##### 2. **Wallet Generation Process**
```typescript
// When user signs up via Supabase
async function onUserSignUp(user: User) {
  // 1. Generate Solana keypair server-side
  const keypair = Keypair.generate()
  
  // 2. Encrypt private key with user's auth token
  const encryptedKey = await encryptPrivateKey(
    keypair.secretKey,
    user.id
  )
  
  // 3. Store in Supabase secure vault
  await supabase.from('user_wallets').insert({
    user_id: user.id,
    public_key: keypair.publicKey.toString(),
    encrypted_private_key: encryptedKey,
    wallet_type: 'custodial',
    created_at: new Date()
  })
  
  // 4. Initialize with welcome bonus
  await mintWelcomeBonus(keypair.publicKey, 10) // 10 BLOX welcome
}
```

##### 3. **Database Schema**
```sql
-- Supabase tables for wallet management
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT, -- Only for custodial wallets
  wallet_type TEXT CHECK (wallet_type IN ('custodial', 'external')),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ -- When user exported to self-custody
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES user_wallets(id),
  transaction_type TEXT,
  amount DECIMAL(20, 9),
  signature TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own wallets" 
  ON user_wallets FOR SELECT 
  USING (auth.uid() = user_id);
```

##### 4. **Security Architecture**
```typescript
// Multi-layer security for custodial wallets
interface SecurityLayers {
  // Layer 1: Supabase Auth
  authentication: 'email/password' | 'oauth' | 'magic-link'
  
  // Layer 2: Encryption
  keyEncryption: {
    algorithm: 'AES-256-GCM'
    keyDerivation: 'PBKDF2'
    saltRounds: 100000
  }
  
  // Layer 3: Access Control
  permissions: {
    maxDailyTransfers: 1000 // BLOX
    requiresMFA: boolean // For large transfers
    cooldownPeriod: 24 // hours for export
  }
  
  // Layer 4: Vault Storage
  storage: {
    provider: 'Supabase Vault' | 'AWS KMS'
    backup: 'encrypted-offsite'
    recovery: 'multi-sig-admin'
  }
}
```

##### 5. **User Experience Flow**

**New User Journey:**
1. **Sign Up** → Email + Password (no wallet needed)
2. **Automatic Setup** → Wallet created in background
3. **Start Learning** → Earn BLOX immediately
4. **View Balance** → See tokens in app (custodial)
5. **Optional Export** → Move to Phantom later

**Progressive Decentralization:**
```typescript
// Wallet evolution stages
enum WalletStage {
  CUSTODIAL = 'custodial',        // Supabase manages (Level 1)
  HYBRID = 'hybrid',               // Both wallets active (Level 2)
  SELF_CUSTODY = 'self-custody'   // User manages (Level 3)
}

// Education triggers
async function checkReadyForSelfCustody(userId: string) {
  const metrics = await getUserMetrics(userId)
  
  if (metrics.totalBLOX > 100 && metrics.daysActive > 30) {
    // Prompt to learn about self-custody
    await sendEducationalContent(userId, 'wallet-basics')
  }
  
  if (metrics.totalBLOX > 500) {
    // Recommend wallet export for security
    await suggestWalletExport(userId)
  }
}
```

##### 6. **Wallet Migration Process**
```typescript
// Seamless migration to self-custody
async function migrateToSelfCustody(userId: string) {
  // Step 1: User installs Phantom/Solflare
  const externalWallet = await connectExternalWallet()
  
  // Step 2: Transfer tokens
  const custodialWallet = await getCustodialWallet(userId)
  const balance = await getBalance(custodialWallet.publicKey)
  
  // Step 3: Execute transfer
  await transferAllTokens(
    from: custodialWallet,
    to: externalWallet,
    amount: balance
  )
  
  // Step 4: Update primary wallet
  await updatePrimaryWallet(userId, externalWallet)
  
  // Step 5: Revoke custodial access (optional)
  await revokeCustodialAccess(userId)
}
```

##### 7. **API Endpoints**
```typescript
// Supabase Edge Functions for wallet operations
export const walletAPI = {
  // Get user's wallet info (public data only)
  GET: '/api/wallet/:userId',
  
  // Check balance
  GET: '/api/wallet/:userId/balance',
  
  // Claim rewards (server-signed transaction)
  POST: '/api/wallet/:userId/claim',
  
  // Transfer tokens (requires auth)
  POST: '/api/wallet/:userId/transfer',
  
  // Export wallet (one-time reveal)
  POST: '/api/wallet/:userId/export',
  
  // Connect external wallet
  POST: '/api/wallet/:userId/connect-external'
}
```

##### 8. **Implementation Benefits**

**For Users:**
- ✅ Zero crypto knowledge required
- ✅ Instant onboarding (< 30 seconds)
- ✅ No seed phrases to manage
- ✅ Can't lose access to tokens
- ✅ Familiar email/password login

**For Platform:**
- ✅ Higher conversion rates
- ✅ Reduced support tickets
- ✅ Progressive Web3 education
- ✅ Compliance-friendly
- ✅ Account recovery possible

**For Security:**
- ✅ Server-side key management
- ✅ Encrypted storage
- ✅ Rate limiting built-in
- ✅ Audit trail for all transactions
- ✅ Optional MFA for high-value ops

##### 9. **Compliance & Legal**
```typescript
interface ComplianceRequirements {
  // KYC/AML thresholds
  kycRequired: balance > 10000, // BLOX
  
  // Terms of Service
  custodialAgreement: 'required',
  liabilityLimitation: 'defined',
  
  // Data protection
  gdprCompliant: true,
  dataRetention: '7 years',
  
  // User rights
  exportRight: 'guaranteed',
  deleteRight: 'with-cooldown'
}
```

##### 10. **Edge Cases & Solutions**

| Scenario | Solution |
|----------|----------|
| User forgets password | Supabase password reset flow |
| Account compromised | Freeze wallet, admin intervention |
| User wants private key | One-time export with warnings |
| Regulatory shutdown | Auto-export all wallets to users |
| Database breach | Keys encrypted, useless without auth |
| User dies/inactive | Inactivity policy after 2 years |

---

### Phase 2: Enhanced Tokenomics System
**Timeline: Day 1-2**

#### XP to BLOX Conversion Rates
| Activity | XP Earned | BLOX Earned | Notes |
|----------|-----------|-------------|-------|
| Watch Video | 10-50 XP | 0.1-0.5 BLOX | Based on video length |
| Complete Day | 100 XP | 1 BLOX | All videos + practice |
| Complete Week | 500 XP | 5 BLOX | Bonus for consistency |
| Complete Module | 3000 XP | 30 BLOX + 10 bonus | Major milestone |
| Daily Login | 10 XP | 0.1 BLOX | Streak bonuses apply |
| Help Teammate | 150 XP | 1.5 BLOX | Community rewards |
| Submit Project | 1500 XP | 15 BLOX | Quality-based bonus |

#### Conversion Formula:
```
Base Rate: 100 XP = 1 BLOX
Streak Bonus: +5% per week (max 50%)
Speed Bonus: +20% for fast completion
Quality Bonus: +10-30% for high scores
```

#### Token Utility (Spending Options):
1. **AI Chat Assistant Access**
   - Daily Pass: 10 BLOX
   - Weekly Pass: 50 BLOX
   - Monthly Pass: 150 BLOX

2. **Premium Features**
   - Advanced Analytics: 100 BLOX/month
   - Priority Support: 50 BLOX/month
   - Custom Themes: 25 BLOX each

3. **Future Features**
   - Blox Code Assistant: Pay-per-use (1-5 BLOX per query)
   - NFT Certificates: 100 BLOX per module
   - Marketplace Access: Variable pricing

4. **Community Features**
   - Create Private Team: 50 BLOX
   - Host Workshop: 25 BLOX
   - Boost Project Visibility: 10 BLOX/day

---

### Phase 3: Dashboard Integration
**Timeline: Day 2**

#### BloxTokenCard Component
```typescript
interface BloxTokenCardProps {
  currentBalance: number
  pendingRewards: number
  totalEarned: number
  nextReward: {
    activity: string
    amount: number
    timeRemaining: string
  }
}
```

#### Features:
- **Balance Overview**: Current, Pending, Total Earned
- **Recent Transactions**: Last 5 token events
- **Quick Actions**: Claim Rewards, Convert XP, View History
- **Earning Projections**: Daily/Weekly/Monthly estimates
- **Mini Chart**: 7-day earning trend

#### Position in Dashboard:
- Below Community Highlights section
- Above Resources section
- Responsive grid layout

---

### Phase 4: Tokenomics Explanation Page
**Timeline: Day 2-3**

#### Route: `/tokenomics`

#### Page Sections:
1. **Hero Section**
   - "Your Learning, Your Rewards"
   - Animated token counter
   - Quick stats display

2. **How It Works**
   - Visual flow diagram
   - Step-by-step earning guide
   - Interactive calculator

3. **Earning Opportunities**
   - Complete activity list
   - Current multipliers
   - Special events

4. **Token Utility**
   - Feature unlock tiers
   - Spending options
   - Coming soon features

5. **Wallet Setup Guide**
   - Recommended wallets
   - Step-by-step instructions
   - Security best practices

6. **FAQ Section**
   - Common questions
   - Troubleshooting
   - Support links

7. **Leaderboard**
   - Top earners
   - Weekly champions
   - Community stats

---

### Phase 5: Smart Contract Integration
**Timeline: Future Enhancement**

#### Contract Features:
1. **Token Standard**: SPL Token on Solana
2. **Supply**: 1 Billion BLOX (fixed)
3. **Distribution**:
   - 40% Learning Rewards Pool
   - 20% Community Treasury
   - 15% Team Development
   - 15% Partnerships
   - 10% Initial Liquidity

#### Contract Functions:
```solidity
- mintReward(user, amount, activity)
- claimRewards(user)
- transferTokens(from, to, amount)
- stakeTokens(amount, duration)
- getBalance(user)
- getRewardHistory(user)
```

---

## 📁 File Structure

### New Files to Create:
```
src/
├── components/
│   ├── wallet/
│   │   ├── WalletButton.tsx
│   │   ├── WalletBalance.tsx
│   │   ├── WalletModal.tsx
│   │   ├── WalletProvider.tsx
│   │   └── index.ts
│   └── dashboard/
│       └── BloxTokenCard.tsx
├── app/
│   └── (app)/
│       └── tokenomics/
│           └── page.tsx
├── lib/
│   └── solana/
│       ├── blox-token.ts
│       ├── rewards.ts
│       └── constants.ts
└── store/
    └── walletStore.ts
```

### Files to Modify:
```
- components/layout/Header/Header.tsx (add wallet button)
- app/(app)/dashboard/page.tsx (add token card)
- lib/providers/wallet-provider.tsx (enhance functionality)
- store/learningStore.ts (integrate token earning)
```

---

## 🔒 Security Considerations

### Wallet Security:
- Never store private keys
- Always confirm transactions
- Use hardware wallet support
- Implement transaction limits
- Add cooldown periods

### Platform Security:
- Rate limiting on claims
- Anti-bot measures
- Audit trail for all transactions
- Regular security audits
- Bug bounty program

### User Education:
- Wallet safety guide
- Phishing awareness
- Transaction verification
- Recovery procedures
- Support channels

---

## 📊 Success Metrics

### Launch Goals (Month 1):
- 1,000+ wallet connections
- 10,000+ BLOX tokens distributed
- 80% user engagement with token features
- 500+ daily active earners

### Growth Goals (Month 3):
- 5,000+ active wallets
- 100,000+ BLOX in circulation
- 50+ BLOX average balance
- 90% retention rate

### Long-term Goals (Year 1):
- 50,000+ token holders
- 1M+ BLOX distributed
- Active token economy
- Cross-platform integration

---

## 🚀 Launch Strategy

### Phase 1: Soft Launch (Week 1)
- Deploy to testnet
- Internal team testing
- Fix critical bugs
- Gather feedback

### Phase 2: Beta Launch (Week 2-3)
- Selected user group
- Limited token distribution
- Monitor metrics
- Iterate on feedback

### Phase 3: Public Launch (Week 4)
- Full feature release
- Marketing campaign
- Community events
- Reward bonuses

---

## 🎮 Gamification Elements

### Achievement Badges:
- **First BLOX**: Earn your first token
- **Centurion**: Earn 100 BLOX
- **Millionaire**: Earn 1,000 BLOX
- **Diamond Hands**: Hold for 30 days
- **Helper**: Reward 10 teammates

### Leaderboards:
- Daily top earners
- Weekly champions
- Monthly legends
- All-time hall of fame

### Special Events:
- Double XP weekends
- Flash challenges
- Community goals
- Seasonal bonuses

---

## 💡 Future Enhancements

### Phase 2 Features:
1. **Staking System**: Lock tokens for rewards
2. **Governance**: Vote on platform decisions
3. **NFT Integration**: Module completion certificates
4. **Marketplace**: Buy/sell learning resources
5. **Cross-chain Bridge**: Ethereum, BSC support

### Integration Opportunities:
- Roblox marketplace integration
- Discord bot rewards
- GitHub contribution rewards
- Stack Overflow integration
- YouTube creator rewards

---

## 📈 Economic Model

### Token Flow:
```
User Activities → XP Generation → BLOX Minting → User Wallet
                                                      ↓
Platform Features ← BLOX Spending ← Feature Access ←
```

### Sustainability:
- Balanced earning/spending economy
- Regular economic adjustments
- Community-driven governance
- Revenue sharing model
- Long-term value creation

---

## 🤝 Community Involvement

### Feedback Channels:
- Discord #tokenomics channel
- Weekly community calls
- Suggestion portal
- Beta testing program

### Transparency:
- Public token metrics dashboard
- Monthly economic reports
- Open development process
- Community proposals

---

## 🔧 Supabase Integration Implementation

### Step-by-Step Setup Guide

#### 1. **Supabase Project Setup**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

#### 2. **Database Migrations**
```sql
-- migrations/001_wallet_tables.sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT,
  wallet_type TEXT DEFAULT 'custodial',
  is_primary BOOLEAN DEFAULT true,
  balance DECIMAL(20, 9) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  transaction_type TEXT NOT NULL,
  signature TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
```

#### 3. **Edge Functions for Wallet Management**
```typescript
// supabase/functions/create-wallet/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Keypair } from '@solana/web3.js'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { user } = await req.json()
  
  // Generate new Solana keypair
  const keypair = Keypair.generate()
  
  // Encrypt private key
  const encryptedKey = await encrypt(
    keypair.secretKey,
    process.env.ENCRYPTION_KEY
  )
  
  // Store in database
  const { data, error } = await supabase
    .from('user_wallets')
    .insert({
      user_id: user.id,
      public_key: keypair.publicKey.toString(),
      encrypted_private_key: encryptedKey,
      wallet_type: 'custodial'
    })
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      publicKey: keypair.publicKey.toString() 
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

#### 4. **Client-Side Integration**
```typescript
// lib/supabase/wallet-service.ts
export class WalletService {
  async getOrCreateWallet(userId: string) {
    // Check if user has wallet
    const { data: existing } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (existing) return existing
    
    // Create new wallet via Edge Function
    const { data } = await supabase.functions.invoke('create-wallet', {
      body: { user: { id: userId } }
    })
    
    return data
  }
  
  async claimRewards(userId: string, amount: number) {
    // Server-side transaction signing
    const { data } = await supabase.functions.invoke('claim-rewards', {
      body: { userId, amount }
    })
    
    return data.signature
  }
}
```

#### 5. **Auth Hook for Auto-Wallet Creation**
```typescript
// app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && !user.user_metadata.wallet_created) {
      // Create wallet for new user
      await supabase.functions.invoke('create-wallet', {
        body: { user }
      })
      
      // Update metadata
      await supabase.auth.updateUser({
        data: { wallet_created: true }
      })
    }
  }
  
  return NextResponse.redirect(requestUrl.origin)
}
```

## 📝 Implementation Checklist

### Week 1: Foundation
- [ ] Set up Supabase project and database
- [ ] Create wallet tables and migrations
- [ ] Implement Edge Functions for wallet ops
- [ ] Build custodial wallet UI components
- [ ] Add auto-wallet creation on signup
- [ ] Test wallet generation flow

### Week 1: UI Integration
- [ ] Wallet UI components
- [ ] Header integration
- [ ] Basic connection flow
- [ ] Balance display
- [ ] Dashboard card

### Week 2:
- [ ] Tokenomics page
- [ ] Reward calculations
- [ ] Transaction history
- [ ] Claiming system
- [ ] Testing & QA

### Week 3:
- [ ] Beta deployment
- [ ] User onboarding
- [ ] Documentation
- [ ] Support setup
- [ ] Monitoring

### Week 4:
- [ ] Public launch
- [ ] Marketing push
- [ ] Community events
- [ ] Feedback collection
- [ ] Iteration

---

## 📚 Resources

### Documentation:
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [SPL Token Program](https://spl.solana.com/token)
- [Phantom Wallet Docs](https://docs.phantom.app/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

### Tools:
- Solana Explorer
- Anchor Framework
- Metaplex SDK
- Jupiter Aggregator

---

## 📞 Support & Contact

### For Developers:
- GitHub Issues
- Discord #dev-support
- dev@bloxbuddy.com

### For Users:
- Help Center
- Video Tutorials
- Community Forum
- support@bloxbuddy.com

---

*Last Updated: August 23, 2024*
*Version: 1.0.0*