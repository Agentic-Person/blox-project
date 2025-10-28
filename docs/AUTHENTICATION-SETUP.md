# Authentication Setup - Email & Password

## Overview

Blox Buddy now requires authentication for all protected routes. Users must sign up with email and password to access the dashboard, Blox Wizard, and other learning features.

## What Changed

### Before
- ❌ Dashboard and Blox Wizard were publicly accessible
- ❌ No login required
- ❌ Chat used hardcoded `userId: 'user'`

### After
- ✅ Email/password authentication required
- ✅ Protected routes require login
- ✅ Real user IDs for chat persistence
- ✅ Each user has isolated data

## Protected Routes

The following routes now require authentication:

```
/dashboard      - Main dashboard
/blox-wizard    - AI chat assistant
/learning       - Learning modules
/teams          - Team features
/profile        - User profile
/settings       - User settings
/notes          - Note-taking
```

## Public Routes

These routes remain accessible without login:

```
/               - Landing page
/login          - Sign in page
/signup         - Sign up page
/about          - About page
/pricing        - Pricing info
/contact        - Contact form
/privacy        - Privacy policy
/terms          - Terms of service
```

## Sign Up Flow

### New User Registration

1. User visits `/signup`
2. Fills out form:
   - Username (optional - defaults to email prefix)
   - Email (required)
   - Password (min 6 characters, required)
   - Confirm Password (required)
3. Submits form
4. Supabase creates account
5. **Optional**: Email confirmation (if enabled in Supabase)
6. Redirects to `/dashboard`

### Form Validation

- ✅ Email format validation
- ✅ Password minimum length (6 characters)
- ✅ Password match confirmation
- ✅ Required field checks
- ✅ Error messages for failures

## Sign In Flow

### Existing User Login

1. User visits `/login` or is redirected from protected route
2. Enters credentials:
   - Email
   - Password
3. Submits form
4. Supabase authenticates
5. Redirects to:
   - Original requested URL (if redirected), or
   - `/dashboard` (default)

### Error Handling

- ❌ Invalid email or password → Error message shown
- ❌ Account not found → "Invalid email or password"
- ❌ Network error → Error message with retry option

## Authentication Provider

**File**: `src/lib/providers/auth-provider.tsx`

### Available Hooks

```typescript
// Get user and auth state
const { user, isLoaded, isSignedIn } = useUser()

// Get auth functions
const { signIn, signOut } = useAuth()
```

### User Object

```typescript
interface User {
  id: string              // Supabase user ID (UUID)
  email: string           // User email
  username: string        // Display name
  avatar?: string         // Avatar URL (if set)
  role: 'student' | 'mentor' | 'admin'
}
```

## Middleware Protection

**File**: `src/middleware.ts`

### How It Works

```typescript
// Request comes in for /dashboard
    ↓
Middleware checks if route is protected
    ↓
If protected → Check Supabase session
    ↓
No session? → Redirect to /login?returnUrl=/dashboard
    ↓
Has session? → Allow access + add user headers
```

### Route Classification

```typescript
ADMIN_ROUTES = ['/admin']           // Requires admin role
PROTECTED_ROUTES = ['/dashboard']   // Requires authentication
PUBLIC_ROUTES = ['/']               // No authentication needed
```

## Supabase Configuration

### Email Confirmation (Optional)

**Disabled by default** for easier testing:

1. Go to Supabase Dashboard
2. Navigate to Authentication → Settings
3. **Email Confirmations**: Disabled
4. Users can sign up and log in immediately

**To Enable**:
1. Enable "Confirm email" in Supabase Auth settings
2. Configure email templates
3. Users must click confirmation link before signing in

### Password Requirements

**Default Settings**:
- Minimum 6 characters
- No special character requirements
- No uppercase requirements

**To Change**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Modify "Password strength" settings

## Environment Variables

Required in `.env`:

```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No additional variables needed for email/password auth!

## Testing the Authentication

### Test Sign Up

1. Start development server: `npm run dev`
2. Visit `http://localhost:3000/signup`
3. Create test account:
   - Email: `test@example.com`
   - Password: `password123`
4. Should redirect to dashboard

### Test Sign In

1. Visit `http://localhost:3000/login`
2. Enter test credentials
3. Should redirect to dashboard

### Test Protected Routes

1. Open incognito/private browsing
2. Visit `http://localhost:3000/dashboard`
3. Should redirect to `/login?returnUrl=/dashboard`
4. After login, should redirect back to dashboard

### Test Chat Persistence

1. Sign in as User A
2. Send chat message in Blox Wizard
3. Navigate to different page
4. Return to Blox Wizard
5. ✅ Chat should persist

6. Sign out
7. Sign in as User B
8. ✅ User B should NOT see User A's messages

## Creating Test Users

### Via Sign Up Page
- Just use the sign-up form
- Instant account creation

### Via Supabase Dashboard
1. Go to Supabase Dashboard
2. Authentication → Users
3. Click "Add User"
4. Fill in email/password
5. User can now log in

### Via SQL (Batch Creation)
```sql
-- Create test users (run in Supabase SQL Editor)
-- Note: This is for testing only!

INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'student1@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## Troubleshooting

### Issue: "Cannot save message" in chat

**Cause**: User not authenticated or RLS policies blocking

**Fix**:
1. Verify user is signed in: Check browser console for `user` object
2. Check Supabase RLS policies are enabled
3. Verify `user.id` is being passed (not `'anonymous'`)

### Issue: Redirected to login immediately

**Cause**: Session expired or middleware not recognizing auth

**Fix**:
1. Clear browser cookies/storage
2. Sign in again
3. Check Supabase session in browser DevTools → Application → Cookies

### Issue: Sign up doesn't work

**Cause**: Email confirmation might be required

**Fix**:
1. Check Supabase Dashboard → Authentication → Settings
2. Disable "Confirm email" for development
3. Or check email for confirmation link

### Issue: "Invalid email or password"

**Cause**: Wrong credentials or account doesn't exist

**Fix**:
1. Try password reset (if implemented)
2. Create new account via `/signup`
3. Check Supabase Dashboard → Authentication → Users to verify account exists

## Admin vs Regular Users

### Regular Users (Students)
- Can access all protected routes
- Can use Blox Wizard
- Cannot access `/admin` routes

### Admin Users
- Must be added to `admin_users` table in Supabase
- Can access `/admin` routes
- All regular user permissions

**To Make User Admin**:
```sql
-- Run in Supabase SQL Editor
INSERT INTO admin_users (user_id, role, is_active)
VALUES (
  'user-uuid-here',
  'admin',
  true
);
```

## Security Best Practices

✅ **Passwords are hashed** - Supabase handles this automatically
✅ **HTTPS in production** - Vercel provides this by default
✅ **RLS policies enabled** - Database-level security
✅ **JWT tokens** - Secure session management
✅ **No passwords in code** - Environment variables only

## Next Steps

### Optional Enhancements

1. **Password Reset Flow**
   - Add "Forgot Password?" link
   - Implement reset email
   - Create reset password page

2. **Social Login**
   - Add Discord OAuth (already partially set up)
   - Google Sign-In
   - GitHub authentication

3. **User Profile Management**
   - Edit profile page
   - Change password
   - Update avatar

4. **Email Confirmation**
   - Enable in Supabase
   - Customize email templates
   - Add resend confirmation option

## Summary

🎉 **Authentication is now fully implemented!**

- ✅ Email/password sign up
- ✅ Email/password login
- ✅ Protected routes with middleware
- ✅ Real user IDs for chat
- ✅ Secure session management
- ✅ Beautiful branded UI

Users must create an account to use Blox Buddy, ensuring:
- Personal chat history
- Progress tracking
- Secure data isolation
- Better user experience

---

*Last Updated: January 2025*
*Status: Fully Implemented and Tested*
