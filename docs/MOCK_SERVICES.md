# Mock Services Documentation

## Overview
All authentication and third-party services are configured with mock implementations to allow development without requiring API keys or authentication setup.

## Active Mock Services

### 1. Authentication (Clerk Mock)
- **Status**: ✅ Active
- **Mock User**: DevUser (auto-logged in development mode)
- **Provider**: `src/lib/providers/auth-provider.tsx`
- **Features**:
  - Auto-login in dev mode
  - Mock Discord OAuth flow
  - User profile management
  - Session persistence

### 2. Database (Supabase Mock)
- **Status**: ✅ Active  
- **Provider**: `src/lib/providers/supabase-provider.tsx`
- **Features**:
  - In-memory data store
  - CRUD operations
  - Mock realtime subscriptions
  - Storage simulation

### 3. Blockchain (Solana Mock)
- **Status**: ✅ Active
- **Provider**: `src/lib/providers/wallet-provider.tsx`
- **Mock Wallet**: `DevWa11et1111111111111111111111111111111111`
- **Features**:
  - Wallet connection simulation
  - Transaction mocking
  - Balance queries

### 4. Payments (Stripe Mock)
- **Status**: ✅ Active
- **Provider**: `src/lib/providers/stripe-provider.tsx`
- **Features**:
  - Payment method creation
  - Checkout simulation
  - Card element mocking

## Environment Configuration

All mock services are controlled via `.env.local`:

```env
# Mock Service Flags
NEXT_PUBLIC_USE_MOCK_AUTH=true      # Clerk authentication
NEXT_PUBLIC_USE_MOCK_SUPABASE=true  # Database
NEXT_PUBLIC_USE_MOCK_WALLET=true    # Solana wallet
NEXT_PUBLIC_USE_MOCK_STRIPE=true    # Payments
```

## Visual Indicators

When running in development mode with mocks active:
- **Top Right**: Blue "🔧 Development Mode" badge
- **Bottom Left**: Yellow "Mock Supabase Active" indicator  
- **Bottom Left**: Purple "Mock Wallet Connected" (when connected)
- **Bottom Left**: Green "Mock Stripe Active" indicator

## Switching to Real Services

To enable real services:

1. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
   # Add other real API keys...
   ```

2. **Services will automatically switch** based on environment variables

## Mock Data Available

### Users
- Mock user with ID `mock-user-123`
- Username: `DevUser`
- Role: `student`

### Teams
- Alpha Builders (recruiting)
- Code Wizards (not recruiting)

### Content
- Sample learning content items
- Mock YouTube video references

## Usage Examples

### Using Mock Auth
```typescript
import { useAuth } from '@/lib/providers'

const { user, signIn, signOut } = useAuth()
// user is automatically populated in dev mode
```

### Using Mock Supabase
```typescript
import { useSupabase } from '@/lib/providers'

const { supabase } = useSupabase()
const { data } = await supabase.from('teams').select()
```

### Using Mock Wallet
```typescript
import { useWallet } from '@/lib/providers'

const { connect, publicKey } = useWallet()
await connect() // Simulates wallet connection
```

## Benefits

✅ **No Authentication Required**: Start developing immediately  
✅ **No API Keys Needed**: All services work out of the box  
✅ **Consistent Data**: Mock data persists during development session  
✅ **Easy Switching**: Toggle between mock and real with env vars  
✅ **Visual Feedback**: Clear indicators show which mocks are active  

## Notes

- Mock data is stored in memory and resets on server restart
- All mock operations have simulated network delays for realism
- Console logs show mock operations for debugging
- Production builds will automatically use real services when configured