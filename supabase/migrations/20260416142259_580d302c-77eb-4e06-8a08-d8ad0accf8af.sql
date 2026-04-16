
-- Create enum types
CREATE TYPE public.action_department AS ENUM (
  'NTSA/KRA',
  'Biashara',
  'Agribusiness',
  'Business Development & Strategy',
  'Finance',
  'ICT',
  'Credit',
  'Collections & Settlements',
  'Operations',
  'Sales Support & Data',
  'Call Centre',
  'Delinquency',
  'Legal',
  'RISK & COMPLIANCE',
  'HR & Admin',
  'Customer Experience & Marketing',
  'Asset Finance',
  'Checkoff & Personal Loans'
);

CREATE TYPE public.action_priority AS ENUM ('high', 'medium', 'low');

CREATE TYPE public.action_progress AS ENUM ('Not Started', '25%', '50%', '75%', '100%');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create actions table
CREATE TABLE public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  department public.action_department NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority public.action_priority NOT NULL,
  owner_email TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  progress_status public.action_progress NOT NULL DEFAULT 'Not Started'::public.action_progress,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own actions"
  ON public.actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own actions"
  ON public.actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions"
  ON public.actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions"
  ON public.actions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_actions_user_id ON public.actions(user_id);
CREATE INDEX idx_actions_owner_email ON public.actions(owner_email);
CREATE INDEX idx_actions_due_date ON public.actions(due_date);

-- Create action_tokens table (for email-based task updates)
CREATE TABLE public.action_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.action_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read action tokens"
  ON public.action_tokens FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create action tokens"
  ON public.action_tokens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update action tokens"
  ON public.action_tokens FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Function to get action token by id and token
CREATE OR REPLACE FUNCTION public.get_action_token_by_id_and_token(p_action_id UUID, p_token TEXT)
RETURNS SETOF public.action_tokens
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.action_tokens
  WHERE action_id = p_action_id AND token = p_token AND used = false AND expires_at > now();
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
