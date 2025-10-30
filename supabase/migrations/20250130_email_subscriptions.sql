-- Create email subscriptions table for coming soon page
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON public.email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_status ON public.email_subscriptions(status);

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the subscription form)
CREATE POLICY "Allow anonymous email subscriptions"
  ON public.email_subscriptions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only allow authenticated users to view subscriptions (for admin purposes)
CREATE POLICY "Allow authenticated users to view subscriptions"
  ON public.email_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.email_subscriptions IS 'Stores email subscriptions from the coming soon landing page';

