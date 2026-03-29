
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Add user_id to leader_profiles
ALTER TABLE public.leader_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to performance_records
ALTER TABLE public.performance_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies on leader_profiles
DROP POLICY IF EXISTS "Public insert leader_profiles" ON public.leader_profiles;
DROP POLICY IF EXISTS "Public read leader_profiles" ON public.leader_profiles;

-- New RLS policies scoped to user
CREATE POLICY "Users read own leader_profiles" ON public.leader_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own leader_profiles" ON public.leader_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Drop old permissive policies on performance_records
DROP POLICY IF EXISTS "Public insert performance_records" ON public.performance_records;
DROP POLICY IF EXISTS "Public read performance_records" ON public.performance_records;
DROP POLICY IF EXISTS "Authenticated update performance_records" ON public.performance_records;

-- New RLS policies scoped to user
CREATE POLICY "Users read own performance_records" ON public.performance_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own performance_records" ON public.performance_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own performance_records" ON public.performance_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
