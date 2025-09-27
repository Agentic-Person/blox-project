-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_wallets table for managing custodial and external wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT, -- Only for custodial wallets, NULL for external
  wallet_type TEXT CHECK (wallet_type IN ('custodial', 'external')) DEFAULT 'custodial',
  is_primary BOOLEAN DEFAULT true,
  balance DECIMAL(20, 9) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ, -- When user exported to self-custody

  -- Constraints
  CONSTRAINT unique_primary_wallet_per_user UNIQUE (user_id, is_primary)
);

-- Create indexes for user_wallets
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON public.user_wallets (public_key);

-- Create wallet_transactions table for tracking all token movements
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'claimed', 'transferred', 'welcome_bonus')),
  signature TEXT, -- Solana transaction signature
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions (status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions (created_at DESC);

-- Create rewards_queue table for pending rewards
CREATE TABLE IF NOT EXISTS public.rewards_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 9) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rewards_queue
CREATE INDEX IF NOT EXISTS idx_rewards_queue_user_id ON public.rewards_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_queue_claimed ON public.rewards_queue (claimed);
CREATE INDEX IF NOT EXISTS idx_rewards_queue_expires_at ON public.rewards_queue (expires_at);

-- Create token_tiers table for tracking user progression
CREATE TABLE IF NOT EXISTS public.token_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_tier TEXT DEFAULT 'Bronze' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master')),
  total_earned DECIMAL(20, 9) DEFAULT 0,
  total_spent DECIMAL(20, 9) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for token_tiers
CREATE INDEX IF NOT EXISTS idx_token_tiers_user_id ON public.token_tiers (user_id);
CREATE INDEX IF NOT EXISTS idx_token_tiers_current_tier ON public.token_tiers (current_tier);

-- Enable Row Level Security
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view own wallets"
  ON public.user_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON public.user_wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM public.user_wallets WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for rewards_queue
CREATE POLICY "Users can view own rewards"
  ON public.rewards_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim own rewards"
  ON public.rewards_queue
  FOR UPDATE
  USING (auth.uid() = user_id AND claimed = false);

-- RLS Policies for token_tiers
CREATE POLICY "Users can view own tier"
  ON public.token_tiers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to automatically create custodial wallet on user signup
CREATE OR REPLACE FUNCTION public.create_custodial_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_public_key TEXT;
BEGIN
  -- Generate a placeholder public key for custodial wallet
  -- In production, this would be generated by an edge function
  v_public_key := 'CUSTODIAL_' || NEW.id::TEXT || '_' || substr(md5(random()::text), 0, 25);
  
  -- Create wallet entry
  INSERT INTO public.user_wallets (
    user_id,
    public_key,
    wallet_type,
    is_primary,
    balance
  ) VALUES (
    NEW.id,
    v_public_key,
    'custodial',
    true,
    10.0 -- Welcome bonus
  );
  
  -- Create welcome bonus transaction
  INSERT INTO public.wallet_transactions (
    wallet_id,
    from_wallet,
    to_wallet,
    amount,
    transaction_type,
    status,
    metadata
  ) VALUES (
    (SELECT id FROM public.user_wallets WHERE user_id = NEW.id LIMIT 1),
    'SYSTEM',
    v_public_key,
    10.0,
    'welcome_bonus',
    'confirmed',
    jsonb_build_object('reason', 'Welcome to Blox Buddy!')
  );
  
  -- Initialize token tier
  INSERT INTO public.token_tiers (
    user_id,
    current_tier,
    total_earned,
    last_active_date
  ) VALUES (
    NEW.id,
    'Bronze',
    10.0,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet on user signup
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_custodial_wallet();

-- Function to update wallet balance after transaction
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Update wallet balance based on transaction type
    IF NEW.transaction_type IN ('earned', 'claimed', 'welcome_bonus') THEN
      UPDATE public.user_wallets
      SET 
        balance = balance + NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.wallet_id;
      
      -- Update token tier total earned
      UPDATE public.token_tiers
      SET 
        total_earned = total_earned + NEW.amount,
        updated_at = NOW()
      WHERE user_id = (SELECT user_id FROM public.user_wallets WHERE id = NEW.wallet_id);
      
    ELSIF NEW.transaction_type IN ('spent', 'transferred') THEN
      UPDATE public.user_wallets
      SET 
        balance = balance - NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.wallet_id;
      
      -- Update token tier total spent
      UPDATE public.token_tiers
      SET 
        total_spent = total_spent + NEW.amount,
        updated_at = NOW()
      WHERE user_id = (SELECT user_id FROM public.user_wallets WHERE id = NEW.wallet_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update balance on transaction status change
CREATE TRIGGER on_transaction_confirmed
  AFTER UPDATE ON public.wallet_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION public.update_wallet_balance();

-- Function to claim rewards from queue
CREATE OR REPLACE FUNCTION public.claim_rewards(p_user_id UUID)
RETURNS TABLE (
  claimed_amount DECIMAL(20, 9),
  transaction_id UUID
) AS $$
DECLARE
  v_total_amount DECIMAL(20, 9);
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get user's primary wallet
  SELECT id INTO v_wallet_id
  FROM public.user_wallets
  WHERE user_id = p_user_id AND is_primary = true
  LIMIT 1;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No primary wallet found for user';
  END IF;
  
  -- Calculate total claimable amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
  FROM public.rewards_queue
  WHERE user_id = p_user_id 
    AND claimed = false 
    AND expires_at > NOW();
  
  IF v_total_amount = 0 THEN
    RETURN QUERY SELECT 0::DECIMAL(20, 9), NULL::UUID;
    RETURN;
  END IF;
  
  -- Create transaction
  INSERT INTO public.wallet_transactions (
    wallet_id,
    from_wallet,
    to_wallet,
    amount,
    transaction_type,
    status,
    metadata
  ) VALUES (
    v_wallet_id,
    'REWARDS_POOL',
    (SELECT public_key FROM public.user_wallets WHERE id = v_wallet_id),
    v_total_amount,
    'claimed',
    'confirmed',
    jsonb_build_object('claimed_at', NOW())
  ) RETURNING id INTO v_transaction_id;
  
  -- Mark rewards as claimed
  UPDATE public.rewards_queue
  SET 
    claimed = true,
    claimed_at = NOW()
  WHERE user_id = p_user_id 
    AND claimed = false 
    AND expires_at > NOW();
  
  RETURN QUERY SELECT v_total_amount, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add reward to queue
CREATE OR REPLACE FUNCTION public.add_reward(
  p_user_id UUID,
  p_amount DECIMAL(20, 9),
  p_reason TEXT,
  p_activity_type TEXT,
  p_xp_earned INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_reward_id UUID;
BEGIN
  INSERT INTO public.rewards_queue (
    user_id,
    amount,
    reason,
    activity_type,
    xp_earned
  ) VALUES (
    p_user_id,
    p_amount,
    p_reason,
    p_activity_type,
    p_xp_earned
  ) RETURNING id INTO v_reward_id;
  
  RETURN v_reward_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tier based on total earned
CREATE OR REPLACE FUNCTION public.update_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total_earned DECIMAL(20, 9);
  v_new_tier TEXT;
BEGIN
  SELECT total_earned INTO v_total_earned
  FROM public.token_tiers
  WHERE user_id = p_user_id;
  
  -- Determine tier based on total earned
  v_new_tier := CASE
    WHEN v_total_earned >= 50000 THEN 'Master'
    WHEN v_total_earned >= 10000 THEN 'Diamond'
    WHEN v_total_earned >= 2000 THEN 'Platinum'
    WHEN v_total_earned >= 500 THEN 'Gold'
    WHEN v_total_earned >= 100 THEN 'Silver'
    ELSE 'Bronze'
  END;
  
  -- Update tier if changed
  UPDATE public.token_tiers
  SET 
    current_tier = v_new_tier,
    updated_at = NOW()
  WHERE user_id = p_user_id AND current_tier != v_new_tier;
  
  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.user_wallets IS 'Stores user wallet information for both custodial and external wallets';
COMMENT ON TABLE public.wallet_transactions IS 'Transaction history for all wallet operations';
COMMENT ON TABLE public.rewards_queue IS 'Queue for pending rewards that users can claim';
COMMENT ON TABLE public.token_tiers IS 'User progression and tier tracking';
COMMENT ON FUNCTION public.create_custodial_wallet() IS 'Automatically creates a custodial wallet when a new user signs up';
COMMENT ON FUNCTION public.claim_rewards(UUID) IS 'Claims all pending rewards for a user';
COMMENT ON FUNCTION public.add_reward(UUID, DECIMAL, TEXT, TEXT, INTEGER) IS 'Adds a reward to the queue for a user';
COMMENT ON FUNCTION public.update_user_tier(UUID) IS 'Updates user tier based on total earned BLOX';