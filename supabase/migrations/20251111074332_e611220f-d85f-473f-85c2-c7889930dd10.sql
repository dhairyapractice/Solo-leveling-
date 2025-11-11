-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  hp INTEGER NOT NULL DEFAULT 100,
  gold_earned INTEGER NOT NULL DEFAULT 0,
  gold_spent INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  pfp1_url TEXT,
  pfp2_url TEXT,
  pfp3_url TEXT,
  current_pfp_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pfp_milestones table for custom PFP level thresholds
CREATE TABLE public.pfp_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_threshold INTEGER NOT NULL,
  pfp_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  criteria_type TEXT, -- 'level', 'exp', 'gold', 'status_level'
  criteria_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges junction table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create status_categories table (Work, Skills, Fitness, etc.)
CREATE TABLE public.status_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.status_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  exp_reward INTEGER NOT NULL DEFAULT 150,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quests table (Daily/Weekly/Monthly tasks)
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'monthly')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('S', 'A', 'B', 'C', 'D')),
  exp_reward INTEGER NOT NULL,
  hp_reward INTEGER NOT NULL,
  status_category_id UUID REFERENCES public.status_categories(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boss_battles table
CREATE TABLE public.boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('S', 'A', 'B', 'C', 'D')),
  status_category_id UUID REFERENCES public.status_categories(id) ON DELETE SET NULL,
  battle_date DATE,
  gold INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_items table (Hunter Shop + Rewards)
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  price INTEGER NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 1,
  item_type TEXT NOT NULL CHECK (item_type IN ('shop', 'rewards')), -- shop uses gold, rewards uses HP
  purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pfp_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pfp_milestones
CREATE POLICY "Users can view own milestones" ON public.pfp_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.pfp_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.pfp_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.pfp_milestones FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Users can view own badges" ON public.badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own badges" ON public.badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own badges" ON public.badges FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Users can view own earned badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own earned badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own earned badges" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for status_categories
CREATE POLICY "Users can view own categories" ON public.status_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.status_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.status_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.status_categories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quests
CREATE POLICY "Users can view own quests" ON public.quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON public.quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests" ON public.quests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for boss_battles
CREATE POLICY "Users can view own battles" ON public.boss_battles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battles" ON public.boss_battles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own battles" ON public.boss_battles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own battles" ON public.boss_battles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shop_items
CREATE POLICY "Users can view own items" ON public.shop_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.shop_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.shop_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.shop_items FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_categories_updated_at BEFORE UPDATE ON public.status_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('hunter-assets', 'hunter-assets', true);

-- Storage policies
CREATE POLICY "Users can view all images" ON storage.objects FOR SELECT USING (bucket_id = 'hunter-assets');
CREATE POLICY "Users can upload their own images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hunter-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (bucket_id = 'hunter-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (bucket_id = 'hunter-assets' AND auth.uid()::text = (storage.foldername(name))[1]);