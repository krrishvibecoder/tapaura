ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS palette jsonb,
  ADD COLUMN IF NOT EXISTS vcard jsonb;