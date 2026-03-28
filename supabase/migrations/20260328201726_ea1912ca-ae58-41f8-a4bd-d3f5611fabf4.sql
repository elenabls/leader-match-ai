
CREATE TABLE public.leader_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  classification TEXT NOT NULL,
  suggested_role_fit TEXT NOT NULL,
  traits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.performance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_a_name TEXT NOT NULL,
  leader_b_name TEXT NOT NULL,
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  scenario TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  strengths TEXT[] DEFAULT '{}',
  risks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leader_profiles" ON public.leader_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert leader_profiles" ON public.leader_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read performance_records" ON public.performance_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert performance_records" ON public.performance_records FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update performance_records" ON public.performance_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
