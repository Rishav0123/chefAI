-- ==========================================
-- FIX: BREAKING INFINITE RECURSION
-- ==========================================

-- 1. Create a Helper Function to check membership SAFELY
-- We use "SECURITY DEFINER" so this function runs with admin privileges
-- This bypasses RLS on "kitchen_members" when called, preventing the loop.
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
-- 2. Apply Policies (Recursion Free)
-- ==========================================

-- ------------------------------------------
-- Table: kitchen_members
-- ------------------------------------------
ALTER TABLE public.kitchen_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view other members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Kitchen owners can manage members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Users can leave kitchens" ON public.kitchen_members;

-- SELECT POLICY:
-- Instead of querying kitchen_members directly in the USING clause,
-- we use the SECURITY DEFINER function or check against "kitchens" (if feasible).
-- Simplest Safe Way: A user can see a membership row IF:
-- 1. It is THEIR own row.
-- 2. It belongs to a kitchen they are part of (checked via function).
CREATE POLICY "Members can view other members"
ON public.kitchen_members FOR SELECT
USING (
    user_id = auth.uid()::text -- I can see myself
    OR
    kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()) -- I can see members of my kitchens
);

-- INSERT/UPDATE/DELETE:
-- Only Owners can manage.
-- We check against "kitchens" table (which is safe to query).
CREATE POLICY "Kitchen owners can manage members"
ON public.kitchen_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.kitchens
        WHERE id = kitchen_members.kitchen_id
        AND owner_id = auth.uid()::text
    )
);

-- LEAVE:
-- Users can delete their own row.
CREATE POLICY "Users can leave kitchens"
ON public.kitchen_members FOR DELETE
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- Table: kitchens
-- ------------------------------------------
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see kitchens they belong to" ON public.kitchens;
DROP POLICY IF EXISTS "Users can bind new kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can update kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can delete kitchens" ON public.kitchens;

-- SELECT:
-- I can see a kitchen if I am the owner OR if I am a member (using safe function).
CREATE POLICY "Users can see kitchens they belong to"
ON public.kitchens FOR SELECT
USING (
  owner_id = auth.uid()::text
  OR
  id IN (SELECT * FROM public.get_my_kitchen_ids())
);

-- INSERT:
CREATE POLICY "Users can bind new kitchens"
ON public.kitchens FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND owner_id = auth.uid()::text);

-- UPDATE/DELETE:
CREATE POLICY "Owners can update kitchens"
ON public.kitchens FOR UPDATE
USING (owner_id = auth.uid()::text);

CREATE POLICY "Owners can delete kitchens"
ON public.kitchens FOR DELETE
USING (owner_id = auth.uid()::text);


-- ------------------------------------------
-- Table: kitchen_stock
-- ------------------------------------------
ALTER TABLE public.kitchen_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access to kitchen stock" ON public.kitchen_stock;

CREATE POLICY "Access to kitchen stock"
ON public.kitchen_stock FOR ALL
USING (
    -- Personal Pantry
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    -- Shared Kitchen (safe check)
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
);


-- ------------------------------------------
-- Table: meals
-- ------------------------------------------
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access to meals" ON public.meals;

CREATE POLICY "Access to meals"
ON public.meals FOR ALL
USING (
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    (kitchen_id IN (SELECT * FROM public.get_my_kitchen_ids()))
);
