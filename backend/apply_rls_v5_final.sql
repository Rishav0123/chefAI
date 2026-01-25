-- ==========================================
-- FINAL RLS SETUP (V5) - FIXING INSERT PERMISSIONS
-- ==========================================

-- 1. Helper Function
CREATE OR REPLACE FUNCTION public.get_my_kitchen_ids()
RETURNS TABLE (kitchen_id text) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT km.kitchen_id
  FROM public.kitchen_members km
  WHERE km.user_id = auth.uid()::text;
END;
$$;

-- ==========================================
-- 2. Define Policies (WITH CHECK added for Inserts)
-- ==========================================

-- ------------------------------------------
-- 1. chat_messages
-- ------------------------------------------
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.chat_messages;

CREATE POLICY "Users can manage their own messages"
ON public.chat_messages
FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- ------------------------------------------
-- 2. uploads
-- ------------------------------------------
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own uploads" ON public.uploads;

CREATE POLICY "Users can manage their own uploads"
ON public.uploads
FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- ------------------------------------------
-- 3. user_profiles
-- ------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

CREATE POLICY "Users can manage their own profile"
ON public.user_profiles
FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);


-- ------------------------------------------
-- 4. kitchen_members
-- ------------------------------------------
ALTER TABLE public.kitchen_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view other members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Kitchen owners can manage members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Users can leave kitchens" ON public.kitchen_members;

-- Select
CREATE POLICY "Members can view other members"
ON public.kitchen_members FOR SELECT
USING (
    user_id = auth.uid()::text
    OR
    kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids())
);

-- Manage (Insert/Update/Delete)
CREATE POLICY "Kitchen owners can manage members"
ON public.kitchen_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.kitchens
        WHERE id = kitchen_members.kitchen_id
        AND owner_id = auth.uid()::text
    )
);

-- Leave
CREATE POLICY "Users can leave kitchens"
ON public.kitchen_members FOR DELETE
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- 5. kitchens
-- ------------------------------------------
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see kitchens they belong to" ON public.kitchens;
DROP POLICY IF EXISTS "Users can bind new kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can update kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can delete kitchens" ON public.kitchens;

CREATE POLICY "Users can see kitchens they belong to"
ON public.kitchens FOR SELECT
USING (
  owner_id = auth.uid()::text
  OR
  id IN (SELECT * FROM public.get_my_kitchen_ids())
);

-- Insert needs WITH CHECK
CREATE POLICY "Users can bind new kitchens"
ON public.kitchens FOR INSERT
WITH CHECK (owner_id = auth.uid()::text);

CREATE POLICY "Owners can update kitchens"
ON public.kitchens FOR UPDATE
USING (owner_id = auth.uid()::text);

CREATE POLICY "Owners can delete kitchens"
ON public.kitchens FOR DELETE
USING (owner_id = auth.uid()::text);


-- ------------------------------------------
-- 6. kitchen_stock
-- ------------------------------------------
ALTER TABLE public.kitchen_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access to kitchen stock" ON public.kitchen_stock;

CREATE POLICY "Access to kitchen stock"
ON public.kitchen_stock FOR ALL
USING (
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
)
WITH CHECK (
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
);


-- ------------------------------------------
-- 7. meals
-- ------------------------------------------
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access to meals" ON public.meals;

CREATE POLICY "Access to meals"
ON public.meals FOR ALL
USING (
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
)
WITH CHECK (
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
);
