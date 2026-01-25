-- ==========================================
-- DISABLE RLS SETTINGS (Backend Handles Auth)
-- ==========================================
-- Since the application uses a Python FastAPI backend to handle all data access,
-- and that backend validates user tokens, we do NOT need Row Level Security 
-- at the database level. RLS is only for "Serverless" apps where frontend queries DB directly.
-- Enabling it caused the backend (which connects as a generic user) to get blocked.

ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Optional: Drop the policies just to be clean (but disabling RLS ignores them anyway)
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can manage their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Members can view other members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Kitchen owners can manage members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Users can leave kitchens" ON public.kitchen_members;
DROP POLICY IF EXISTS "Users can see kitchens they belong to" ON public.kitchens;
DROP POLICY IF EXISTS "Users can bind new kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can update kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can delete kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Access to kitchen stock" ON public.kitchen_stock;
DROP POLICY IF EXISTS "Access to meals" ON public.meals;
