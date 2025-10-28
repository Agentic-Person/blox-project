# 🎯 Blox Buddy: User Access Control & Monetization Implementation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Three-Tier Access System](#three-tier-access-system)
3. [Database Schema](#database-schema)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Access Control Logic](#access-control-logic)
6. [Admin Panel Design](#admin-panel-design)
7. [Beta Tester Management](#beta-tester-management)
8. [Stripe Integration](#stripe-integration)
9. [UI Components](#ui-components)
10. [Testing Checklist](#testing-checklist)
11. [Code Examples](#code-examples)

---

## Overview

This document outlines the complete implementation strategy for Blox Buddy's three-tier user access system with Stripe monetization. The goal is to provide:

- **Full admin access** for platform owner (you)
- **Beta tester access** for 2-3 invited developers (free, no payment)
- **Freemium model** for all other users (platform access free, AI Chat requires Stripe payment)

### Business Goals
- Demonstrate the platform's value to attract users
- Allow trusted testers to provide feedback without payment friction
- Monetize the AI Chat feature (Blox Wizard) through Stripe subscriptions
- Maintain flexibility for future pricing changes

---

## Three-Tier Access System

### Tier 1: Administrator
**Who:** Platform owner (your account)
**Access Level:** Unlimited, unrestricted
**Features:**
- ✅ Full AI Chat access (unlimited messages)
- ✅ All platform features
- ✅ Admin panel access
- ✅ User management capabilities
- ✅ Beta invitation generation
- ✅ Override all restrictions
- ✅ View usage analytics

**Implementation:**
- Hardcoded admin email check (immediate)
- Database `user_tier = 'admin'` (scalable)
- Special admin role in `admin_users` table

---

### Tier 2: Beta Testers
**Who:** 2-3 invited developers/testers
**Access Level:** Full access, no payment required
**Features:**
- ✅ Full AI Chat access (unlimited messages)
- ✅ All platform features
- ✅ No Stripe requirement
- ❌ No admin panel access
- ❌ No user management

**Implementation Methods:**

#### Option A: Invitation Codes (Recommended)
```typescript
// Admin generates codes like: BETA-2024-ABC123
// Beta user enters during signup
// System validates and upgrades tier to 'beta'

const invitationCode = generateBetaCode() // "BETA-2024-ABC123"
```

**Pros:**
- Professional
- Trackable
- Secure
- Can set expiration dates
- Can limit usage

**Cons:**
- More code to write
- Requires UI for code entry

#### Option B: Email Whitelist (Faster)
```typescript
// Hardcoded whitelist
const BETA_EMAILS = [
  'tester1@example.com',
  'tester2@example.com',
  'developer@example.com'
]

// Check on login, auto-upgrade
if (BETA_EMAILS.includes(user.email)) {
  upgradeUserTier(user.id, 'beta')
}
```

**Pros:**
- Quick to implement (30 minutes)
- No additional UI needed
- Easy to add/remove users

**Cons:**
- Less professional
- Requires code changes to add testers
- No tracking

---

### Tier 3: Regular Users (Freemium)
**Who:** All other registered users
**Access Level:** Platform free, AI Chat requires payment
**Features:**
- ✅ Full platform access (learning content, calendar, todos, progress tracking)
- ✅ Profile management
- ✅ Community features
- ❌ AI Chat locked behind paywall
- ❌ Must subscribe via Stripe for AI access

**Conversion Flow:**
1. User clicks "Upgrade to Premium" in AI Chat
2. Redirect to pricing page
3. Stripe checkout session
4. Payment successful → Tier upgraded to 'premium'
5. AI Chat unlocked

---

## Database Schema

### 1. Extend Users Table

Add to existing `users` table or create junction table `user_subscriptions`:

```sql
-- Option A: Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
  CHECK (user_tier IN ('admin', 'beta', 'premium', 'free'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT
  CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'trialing'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Beta tester tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_access_granted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_access_granted_at TIMESTAMPTZ;

-- Create index for fast tier lookups
CREATE INDEX idx_users_tier ON users(user_tier);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

### 2. Beta Invitations Table (Optional but Recommended)

```sql
CREATE TABLE IF NOT EXISTS beta_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_code TEXT UNIQUE NOT NULL,
  email TEXT, -- Optional: pre-assign to specific email
  invited_by UUID REFERENCES users(id) NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_code CHECK (length(invitation_code) > 5)
);

CREATE INDEX idx_beta_invitations_code ON beta_invitations(invitation_code);
CREATE INDEX idx_beta_invitations_used ON beta_invitations(used) WHERE NOT used;
```

### 3. Subscription History Table (Optional - for analytics)

```sql
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'expired'
  stripe_event_id TEXT,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_event ON subscription_history(event_type);
```

---

## Implementation Roadmap

### Phase 1: Quick Hardcoded Solution (30-60 minutes)
**Goal:** Get you testing immediately

#### Steps:
1. ✅ **Fix AI Chat bug** (COMPLETED)
2. **Add tier check to components:**
   ```typescript
   // src/lib/utils/access-control.ts
   const ADMIN_EMAILS = ['your-admin@email.com']
   const BETA_EMAILS = ['tester1@email.com', 'tester2@email.com']

   export function hasAIChatAccess(user: User): boolean {
     if (!user) return false
     if (ADMIN_EMAILS.includes(user.email)) return true
     if (BETA_EMAILS.includes(user.email)) return true
     return false // Block everyone else for now
   }
   ```

3. **Wrap AI Chat with access check:**
   ```typescript
   // In AIChat.tsx and BloxWizardDashboard.tsx
   if (!hasAIChatAccess(user)) {
     return <UpgradePrompt />
   }
   ```

4. **Test with your account** ✅

**Result:** You can test immediately, beta testers can access, everyone else sees upgrade prompt.

---

### Phase 2: Database-Driven Tiers (2-3 hours)
**Goal:** Scalable, professional solution

#### Steps:
1. **Run database migration** (add tier columns)
2. **Create tier service:**
   ```typescript
   // src/lib/services/tier-service.ts
   export async function getUserTier(userId: string): Promise<UserTier>
   export async function upgradeToB eta(userId: string): Promise<boolean>
   export async function upgradeToPremium(userId: string): Promise<boolean>
   ```

3. **Update auth provider** to include tier in user object
4. **Replace hardcoded checks** with database lookups
5. **Add admin panel** for tier management

---

### Phase 3: Beta Invitation System (3-4 hours)
**Goal:** Professional tester onboarding

#### Steps:
1. **Create admin page:** `/dashboard/admin/beta-invitations`
2. **Build invitation generator:**
   ```typescript
   function generateBetaCode(): string {
     const prefix = 'BETA'
     const year = new Date().getFullYear()
     const random = crypto.randomUUID().slice(0, 8).toUpperCase()
     return `${prefix}-${year}-${random}`
   }
   ```
3. **Create signup code entry UI**
4. **Validate and redeem codes on signup**
5. **Show invitation status in admin panel**

---

### Phase 4: Stripe Integration (4-6 hours)
**Goal:** Full monetization system

#### Steps:
1. **Set up Stripe account & products**
2. **Create checkout session endpoint**
3. **Implement webhook handler**
4. **Add subscription management page**
5. **Test payment flow thoroughly**

*(Detailed Stripe implementation in separate section below)*

---

## Access Control Logic

### Where to Check Access

#### 1. Frontend Component Level
**File:** `src/components/blox-wizard/AIChat.tsx`

```typescript
export function AIChat() {
  const { user } = useUser()
  const { tier, hasAIChatAccess } = useUserTier()

  // Show different UI based on tier
  if (!hasAIChatAccess) {
    return <UpgradePrompt user={user} />
  }

  // Show full AI Chat
  return <AIChatInterface />
}
```

**Benefits:**
- Fast (no API call needed)
- Good UX (immediate feedback)
- Can show contextual upgrade messaging

**Drawbacks:**
- Can be bypassed by modifying client code
- Not secure on its own

---

#### 2. API Route Level (CRITICAL)
**File:** `src/app/api/chat/blox-wizard/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  // CRITICAL: Verify access server-side
  const hasAccess = await checkAIChatAccess(userId)

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: 'Premium feature: Upgrade to access AI Chat',
        upgradeUrl: '/pricing'
      },
      { status: 403 }
    )
  }

  // Continue with AI request...
}
```

**Benefits:**
- Secure (cannot be bypassed)
- Enforces business rules
- Can log unauthorized attempts

**Drawbacks:**
- Requires database lookup per request
- Adds latency

**Solution:** Cache tier in JWT or session

---

#### 3. Database Level (Defense in Depth)
**File:** Supabase RLS policies

```sql
-- Only allow AI chat messages for premium/beta/admin users
CREATE POLICY "AI chat requires premium access"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        user_tier IN ('admin', 'beta', 'premium')
        OR subscription_status = 'active'
      )
    )
  );
```

**Benefits:**
- Ultimate security layer
- Protects data integrity
- Works even if API is compromised

**Drawbacks:**
- Can be slow (complex queries)
- Harder to debug
- Less flexible

---

## Admin Panel Design

### Location
`/dashboard/admin` (protected route - admin only)

### Features

#### 1. User Management
```
┌─────────────────────────────────────────────────┐
│ 👥 User Management                              │
├─────────────────────────────────────────────────┤
│ Search: [_________________________] [Filter ▾]  │
│                                                  │
│ ┌────┬─────────────┬────────┬────────┬────────┐│
│ │ ID │ Email       │ Tier   │ Status │ Actions ││
│ ├────┼─────────────┼────────┼────────┼────────┤│
│ │ 1  │ admin@...   │ Admin  │ Active │ [View] ││
│ │ 2  │ tester@...  │ Beta   │ Active │ [Edit] ││
│ │ 3  │ user@...    │ Free   │ Active │ [Edit] ││
│ │ 4  │ premium@... │ Premium│ Active │ [View] ││
│ └────┴─────────────┴────────┴────────┴────────┘│
└─────────────────────────────────────────────────┘
```

**Actions:**
- View user details
- Manually upgrade/downgrade tier
- Grant/revoke beta access
- View usage statistics
- Disable/enable user

---

#### 2. Beta Invitation Management
```
┌─────────────────────────────────────────────────┐
│ 🎫 Beta Invitations                             │
├─────────────────────────────────────────────────┤
│ [+ Generate New Code]                           │
│                                                  │
│ ┌───────────────┬────────┬──────────┬─────────┐│
│ │ Code          │ Status │ Used By  │ Actions ││
│ ├───────────────┼────────┼──────────┼─────────┤│
│ │ BETA-2024-... │ ✅ Used│ tester@..│ [View]  ││
│ │ BETA-2024-... │ ⏳ Pen │ -        │ [Copy]  ││
│ │ BETA-2024-... │ ❌ Exp │ -        │ [Delete]││
│ └───────────────┴────────┴──────────┴─────────┘│
└─────────────────────────────────────────────────┘
```

**Features:**
- One-click code generation
- Copy code to clipboard
- Email invitation directly (optional)
- Set expiration dates
- Revoke unused codes
- Track usage

---

#### 3. Analytics Dashboard
```
┌─────────────────────────────────────────────────┐
│ 📊 Platform Analytics                           │
├─────────────────────────────────────────────────┤
│ Total Users: 247                                │
│ ├─ Admin: 1                                     │
│ ├─ Beta: 3                                      │
│ ├─ Premium: 15                                  │
│ └─ Free: 228                                    │
│                                                  │
│ Revenue (This Month): $225                      │
│ Active Subscriptions: 15                        │
│ Churn Rate: 3.2%                                │
│                                                  │
│ AI Chat Usage:                                  │
│ ├─ Total Messages: 12,458                       │
│ ├─ Avg per Premium User: 83                     │
│ └─ API Cost: $45.23                             │
└─────────────────────────────────────────────────┘
```

---

## Beta Tester Management

### Method 1: Invitation Codes (Recommended)

#### Code Generation
```typescript
// src/lib/services/beta-invitation-service.ts

export async function createBetaInvitation(
  adminUserId: string,
  options?: {
    email?: string
    expiresInDays?: number
  }
): Promise<{ code: string; id: string }> {
  const code = generateBetaCode()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (options?.expiresInDays || 30))

  const { data, error } = await supabase
    .from('beta_invitations')
    .insert({
      invitation_code: code,
      email: options?.email || null,
      invited_by: adminUserId,
      expires_at: expiresAt.toISOString()
    })
    .select('id, invitation_code')
    .single()

  if (error) throw error

  return {
    code: data.invitation_code,
    id: data.id
  }
}

function generateBetaCode(): string {
  const prefix = 'BETA'
  const year = new Date().getFullYear()
  const random = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `${prefix}-${year}-${random}`
}
```

#### Code Redemption (Signup Flow)
```typescript
// src/app/(auth)/signup/page.tsx

async function handleSignupWithBetaCode(
  email: string,
  password: string,
  betaCode?: string
) {
  // 1. Create account
  const { user, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // 2. If beta code provided, validate and upgrade
  if (betaCode) {
    const upgraded = await redeemBetaCode(user.id, betaCode)
    if (upgraded) {
      toast.success('Beta access granted! Welcome to the team! 🎉')
    } else {
      toast.error('Invalid or expired beta code')
    }
  }
}

async function redeemBetaCode(
  userId: string,
  code: string
): Promise<boolean> {
  // Validate invitation
  const { data: invitation, error } = await supabase
    .from('beta_invitations')
    .select('*')
    .eq('invitation_code', code)
    .eq('used', false)
    .single()

  if (error || !invitation) return false

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    return false
  }

  // Upgrade user to beta
  await supabase
    .from('users')
    .update({ user_tier: 'beta', beta_access_granted_at: new Date().toISOString() })
    .eq('id', userId)

  // Mark invitation as used
  await supabase
    .from('beta_invitations')
    .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return true
}
```

---

### Method 2: Email Whitelist (Quick Start)

#### Implementation
```typescript
// src/lib/config/beta-users.ts

export const BETA_EMAILS = [
  'tester1@example.com',
  'tester2@example.com',
  'developer@example.com'
]

export function isBetaUser(email: string): boolean {
  return BETA_EMAILS.includes(email.toLowerCase())
}
```

#### Auto-Upgrade on Login
```typescript
// src/lib/providers/auth-provider.tsx

useEffect(() => {
  const checkBetaStatus = async (user: User) => {
    if (isBetaUser(user.email)) {
      // Auto-upgrade to beta if not already
      const { data: userData } = await supabase
        .from('users')
        .select('user_tier')
        .eq('id', user.id)
        .single()

      if (userData?.user_tier === 'free') {
        await supabase
          .from('users')
          .update({ user_tier: 'beta' })
          .eq('id', user.id)

        toast.success('Beta access activated! 🎉')
      }
    }
  }

  if (user) {
    checkBetaStatus(user)
  }
}, [user])
```

---

## Stripe Integration

### Setup Checklist

#### 1. Stripe Account Setup
- [ ] Create Stripe account (or use existing)
- [ ] Get API keys (test and live)
- [ ] Enable webhooks
- [ ] Configure webhook endpoint in Stripe dashboard

#### 2. Product & Pricing Setup
```
Product: Blox Wizard Premium
Description: Unlimited AI Chat assistance for Roblox development
Price: $9.99/month (or your choice)
Billing: Monthly recurring
```

Stripe Dashboard:
1. Products → Create Product
2. Name: "Blox Wizard Premium"
3. Add pricing: $9.99/month
4. Copy Price ID: `price_abc123...`

#### 3. Environment Variables
```bash
# Add to .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_abc123...
```

---

### API Endpoints

#### 1. Create Checkout Session
**File:** `src/app/api/stripe/create-checkout-session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Get user email
    const supabase = createClientComponentClient()
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or use existing Stripe customer
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

#### 2. Webhook Handler
**File:** `src/app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  await supabase
    .from('users')
    .update({
      user_tier: 'premium',
      subscription_status: 'active',
      stripe_subscription_id: session.subscription as string,
      subscription_started_at: new Date().toISOString()
    })
    .eq('id', userId)

  console.log(`User ${userId} upgraded to premium`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) return

  await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('id', user.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) return

  await supabase
    .from('users')
    .update({
      user_tier: 'free',
      subscription_status: 'canceled',
      subscription_ends_at: new Date().toISOString()
    })
    .eq('id', user.id)

  console.log(`User ${user.id} subscription canceled`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Log successful payment for analytics
  console.log('Payment succeeded:', invoice.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Notify user of payment failure
  console.error('Payment failed:', invoice.id)
  // TODO: Send email notification
}
```

---

### Frontend Integration

#### Upgrade Button
```typescript
// src/components/blox-wizard/UpgradePrompt.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/card'
import { useUser } from '@/lib/providers'
import toast from 'react-hot-toast'

export function UpgradePrompt() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user?.id) {
      toast.error('Please log in first')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const { url, error } = await response.json()

      if (error) {
        toast.error('Failed to start checkout')
        return
      }

      // Redirect to Stripe checkout
      window.location.href = url
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Unlock AI Chat Assistant</h2>
        <p className="text-blox-off-white">
          Get unlimited access to your personal Roblox development AI assistant
        </p>
      </div>

      <div className="mb-8 text-left">
        <h3 className="font-semibold mb-2">Premium Features:</h3>
        <ul className="space-y-2">
          <li>✅ Unlimited AI conversations</li>
          <li>✅ Video transcript analysis</li>
          <li>✅ Smart learning suggestions</li>
          <li>✅ Code help & debugging</li>
          <li>✅ Priority support</li>
        </ul>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold mb-1">$9.99/month</div>
        <div className="text-sm text-blox-off-white">Cancel anytime</div>
      </div>

      <Button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="w-full max-w-xs bg-gradient-to-r from-blox-teal to-blox-teal-dark"
      >
        {isLoading ? 'Loading...' : 'Upgrade to Premium'}
      </Button>
    </div>
  )
}
```

---

## UI Components

### 1. Tier Badge
```typescript
// src/components/ui/tier-badge.tsx

import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles, User } from 'lucide-react'

export function TierBadge({ tier }: { tier: 'admin' | 'beta' | 'premium' | 'free' }) {
  const configs = {
    admin: {
      label: 'Admin',
      icon: Crown,
      className: 'bg-purple-500 text-white'
    },
    beta: {
      label: 'Beta Tester',
      icon: Sparkles,
      className: 'bg-blue-500 text-white'
    },
    premium: {
      label: 'Premium',
      icon: Crown,
      className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
    },
    free: {
      label: 'Free',
      icon: User,
      className: 'bg-gray-500 text-white'
    }
  }

  const config = configs[tier]
  const Icon = config.icon

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}
```

### 2. Access Check Hook
```typescript
// src/hooks/useUserTier.ts

import { useUser } from '@/lib/providers'
import { useMemo } from 'react'

export function useUserTier() {
  const { user } = useUser()

  const tier = user?.user_tier || 'free'

  const hasAIChatAccess = useMemo(() => {
    return ['admin', 'beta', 'premium'].includes(tier)
  }, [tier])

  const isAdmin = tier === 'admin'
  const isBeta = tier === 'beta'
  const isPremium = tier === 'premium'
  const isFree = tier === 'free'

  return {
    tier,
    hasAIChatAccess,
    isAdmin,
    isBeta,
    isPremium,
    isFree
  }
}
```

---

## Testing Checklist

### Admin Tier Testing
- [ ] Log in with admin email
- [ ] Verify full AI Chat access
- [ ] Test unlimited messages
- [ ] Access admin panel at `/dashboard/admin`
- [ ] Generate beta invitation code
- [ ] View user list
- [ ] Manually upgrade user tier

### Beta Tier Testing
- [ ] Create beta invitation code
- [ ] Use code during signup
- [ ] Verify tier upgraded to 'beta'
- [ ] Test full AI Chat access
- [ ] Confirm no Stripe checkout shown
- [ ] Verify cannot access admin panel
- [ ] Test code expiration
- [ ] Test already-used code rejection

### Free Tier Testing
- [ ] Create new account without beta code
- [ ] Verify tier is 'free'
- [ ] Confirm AI Chat shows upgrade prompt
- [ ] Test platform features work (calendar, todos, etc.)
- [ ] Click "Upgrade to Premium"
- [ ] Verify redirect to Stripe checkout

### Premium Tier Testing
- [ ] Complete Stripe checkout in test mode
- [ ] Verify webhook receives subscription event
- [ ] Confirm tier upgraded to 'premium'
- [ ] Test AI Chat unlocked
- [ ] Verify subscription shows in Stripe dashboard
- [ ] Test subscription cancellation
- [ ] Confirm tier reverts to 'free' after cancel

---

## Code Examples

### Access Control Service
```typescript
// src/lib/services/access-control-service.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type UserTier = 'admin' | 'beta' | 'premium' | 'free'

export async function checkAIChatAccess(userId: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('user_tier, subscription_status')
    .eq('id', userId)
    .single()

  if (error || !user) return false

  // Check tier
  if (['admin', 'beta', 'premium'].includes(user.user_tier)) {
    return true
  }

  // Double-check subscription status for premium users
  if (user.subscription_status === 'active') {
    return true
  }

  return false
}

export async function getUserTier(userId: string): Promise<UserTier> {
  const supabase = createClientComponentClient()

  const { data: user } = await supabase
    .from('users')
    .select('user_tier')
    .eq('id', userId)
    .single()

  return (user?.user_tier as UserTier) || 'free'
}

export async function upgradeUserTier(
  userId: string,
  newTier: UserTier
): Promise<boolean> {
  const supabase = createClientComponentClient()

  const { error } = await supabase
    .from('users')
    .update({ user_tier: newTier })
    .eq('id', userId)

  return !error
}
```

---

### Protected Route Wrapper
```typescript
// src/components/auth/ProtectedRoute.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/providers'
import { useUserTier } from '@/hooks/useUserTier'
import { useEffect } from 'react'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { isAdmin } = useUserTier()

  useEffect(() => {
    if (isLoaded && (!user || !isAdmin)) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, isAdmin, router])

  if (!isLoaded || !isAdmin) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}

export function RequirePremium({ children, fallback }: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasAIChatAccess } = useUserTier()

  if (!hasAIChatAccess) {
    return <>{fallback || <UpgradePrompt />}</>
  }

  return <>{children}</>
}
```

---

## Migration Files

### Add User Tier Columns
**File:** `supabase/migrations/008_user_tiers.sql`

```sql
-- Add user tier columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
  CHECK (user_tier IN ('admin', 'beta', 'premium', 'free'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT
  CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'trialing'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_access_granted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_access_granted_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(user_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Update RLS policies for AI Chat based on tier
CREATE POLICY "AI chat requires premium access"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        user_tier IN ('admin', 'beta', 'premium')
        OR subscription_status = 'active'
      )
    )
  );

-- Comments
COMMENT ON COLUMN users.user_tier IS 'User access tier: admin, beta, premium, or free';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status';
```

### Beta Invitations Table
**File:** `supabase/migrations/009_beta_invitations.sql`

```sql
CREATE TABLE IF NOT EXISTS beta_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_code TEXT UNIQUE NOT NULL,
  email TEXT,
  invited_by UUID REFERENCES users(id) NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_code CHECK (length(invitation_code) > 5)
);

CREATE INDEX idx_beta_invitations_code ON beta_invitations(invitation_code);
CREATE INDEX idx_beta_invitations_used ON beta_invitations(used) WHERE NOT used;

-- Enable RLS
ALTER TABLE beta_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage invitations"
  ON beta_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_tier = 'admin'
    )
  );

CREATE POLICY "Anyone can view valid unused codes for redemption"
  ON beta_invitations FOR SELECT
  USING (
    NOT used AND expires_at > NOW()
  );

-- Function to redeem invitation
CREATE OR REPLACE FUNCTION redeem_beta_invitation(
  p_user_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation_id UUID;
BEGIN
  -- Find and validate invitation
  SELECT id INTO v_invitation_id
  FROM beta_invitations
  WHERE invitation_code = p_code
    AND NOT used
    AND expires_at > NOW();

  IF v_invitation_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Upgrade user
  UPDATE users
  SET user_tier = 'beta',
      beta_access_granted_at = NOW()
  WHERE id = p_user_id;

  -- Mark invitation used
  UPDATE beta_invitations
  SET used = TRUE,
      used_by = p_user_id,
      used_at = NOW()
  WHERE id = v_invitation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Next Steps

1. **Deploy migrations** to add tier system
2. **Choose beta invitation method** (codes or whitelist)
3. **Set up Stripe account** and products
4. **Implement chosen approach** (quick hardcoded or full system)
5. **Test thoroughly** with each tier
6. **Document pricing** on landing/pricing page
7. **Monitor analytics** and adjust pricing as needed

---

## Support & Questions

If you need help implementing any part of this system:
- Review the code examples above
- Check the migration files
- Test in development first
- Use Stripe test mode for all testing
- Monitor Supabase logs for errors

**Remember:**
- Never commit Stripe secret keys
- Always validate server-side
- Test webhooks with Stripe CLI
- Keep admin emails secure
- Log all tier changes for audit

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Ready for Implementation
