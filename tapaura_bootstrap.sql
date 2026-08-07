-- Run this SQL in your own Supabase project (SQL Editor → New query) to set up the same
-- schema, policies, and storage that the app currently uses on Lovable Cloud.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  logo_path TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Connect With Us',
  cta_url TEXT,
  theme TEXT NOT NULL DEFAULT 'blue',
  published BOOLEAN NOT NULL DEFAULT true,
  palette JSONB,
  vcard JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clients_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  CONSTRAINT clients_name_len CHECK (char_length(name) BETWEEN 1 AND 80)
);
CREATE INDEX clients_owner_idx ON public.clients(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT ON public.clients TO anon;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_owner_all" ON public.clients FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clients_public_read_published" ON public.clients FOR SELECT TO anon
  USING (published = true);

-- ---------------------------------------------------------------------------
-- client_links
-- ---------------------------------------------------------------------------
CREATE TABLE public.client_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  subtitle TEXT,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_links_title_len CHECK (char_length(title) BETWEEN 1 AND 60)
);
CREATE INDEX client_links_client_idx ON public.client_links(client_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_links TO authenticated;
GRANT SELECT ON public.client_links TO anon;
GRANT ALL ON public.client_links TO service_role;
ALTER TABLE public.client_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_links_owner_all" ON public.client_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.owner_id = auth.uid()));
CREATE POLICY "client_links_public_read_published" ON public.client_links FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.published = true));

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reserved slugs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_reserved_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug = ANY (ARRAY[
    'auth','login','logout','signup','sign-in','sign-up','dashboard','api','admin',
    'app','account','settings','profile','clients','client','new','edit','about',
    'pricing','terms','privacy','support','help','docs','blog','static','assets',
    'public','favicon','robots','sitemap','_serverfn','www'
  ]) THEN
    RAISE EXCEPTION 'slug_reserved';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER clients_check_reserved_slug BEFORE INSERT OR UPDATE OF slug ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.check_reserved_slug();

-- ---------------------------------------------------------------------------
-- auto-create profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lock down the trigger function so only postgres can invoke it directly
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- storage: client-logos bucket and policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-logos',
  'client-logos',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
