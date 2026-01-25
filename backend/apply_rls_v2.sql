-- ==========================================
-- 1. Helper Functions (To prevent logic duplication)
-- ==========================================

-- Check if the current user is a member of a kitchen
-- SECURITY DEFINER is used to ensure this function can read kitchen_members
-- regardless of the RLS on that table (though we structure RLS to allow it anyway).
CREATE OR REPLACE FUNCTION public.is_kitchen_member(_kitchen_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.kitchen_members
    WHERE kitchen_id = _kitchen_id
    AND user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. Enable RLS on All Tables
-- ==========================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Define Policies
-- ==========================================

-- ------------------------------------------
-- Table: chat_messages
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.chat_messages;

CREATE POLICY "Users can manage their own messages"
ON public.chat_messages
FOR ALL
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- Table: uploads
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own uploads" ON public.uploads;

CREATE POLICY "Users can manage their own uploads"
ON public.uploads
FOR ALL
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- Table: user_profiles
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

CREATE POLICY "Users can manage their own profile"
ON public.user_profiles
FOR ALL
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- Table: kitchens
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can see kitchens they belong to" ON public.kitchens;
DROP POLICY IF EXISTS "Users can bind new kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can update kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Owners can delete kitchens" ON public.kitchens;

-- Select: Owner OR Member
CREATE POLICY "Users can see kitchens they belong to"
ON public.kitchens FOR SELECT
USING (
  owner_id = auth.uid()::text 
  OR 
  id IN (SELECT kitchen_id FROM public.kitchen_members WHERE user_id = auth.uid()::text)
);

-- Insert: Any authenticated user
CREATE POLICY "Users can bind new kitchens"
ON public.kitchens FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND owner_id = auth.uid()::text);

-- Update: Only Owner
CREATE POLICY "Owners can update kitchens"
ON public.kitchens FOR UPDATE
USING (owner_id = auth.uid()::text);

-- Delete: Only Owner
CREATE POLICY "Owners can delete kitchens"
ON public.kitchens FOR DELETE
USING (owner_id = auth.uid()::text);


-- ------------------------------------------
-- Table: kitchen_members
-- ------------------------------------------
DROP POLICY IF EXISTS "Members can view other members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Kitchen owners can manage members" ON public.kitchen_members;
DROP POLICY IF EXISTS "Users can leave kitchens" ON public.kitchen_members;

-- Select: If I am a member of this kitchen, I can see all members
-- Loop breaker: We query the table directly but filter by *my* user_id in the sub-logic
CREATE POLICY "Members can view other members"
ON public.kitchen_members FOR SELECT
USING (
    -- I am the user in this row
    user_id = auth.uid()::text
    OR
    -- I am a member of this kitchen (see helper function)
    exists (
        select 1 from public.kitchen_members as km 
        where km.kitchen_id = kitchen_members.kitchen_id 
        and km.user_id = auth.uid()::text
    )
);

-- Insert/Update/Delete: Kitchen Owner Only
-- We need to check if the current user is the owner of the referenced kitchen
CREATE POLICY "Kitchen owners can manage members"
ON public.kitchen_members FOR ALL
USING (
    exists (
        select 1 from public.kitchens 
        where id = kitchen_members.kitchen_id 
        and owner_id = auth.uid()::text
    )
);

-- Users can remove THEMSELVES (Leave)
CREATE POLICY "Users can leave kitchens"
ON public.kitchen_members FOR DELETE
USING (user_id = auth.uid()::text);


-- ------------------------------------------
-- Table: kitchen_stock
-- ------------------------------------------
DROP POLICY IF EXISTS "Access to kitchen stock" ON public.kitchen_stock;

CREATE POLICY "Access to kitchen stock"
ON public.kitchen_stock FOR ALL
USING (
    -- Case 1: Personal Pantry (kitchen_id is null, belongs to user)
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    -- Case 2: Shared Kitchen (user is member)
    (kitchen_id IS NOT NULL AND is_kitchen_member(kitchen_id))
);


-- ------------------------------------------
-- Table: meals
-- ------------------------------------------
DROP POLICY IF EXISTS "Access to meals" ON public.meals;

CREATE POLICY "Access to meals"
ON public.meals FOR ALL
USING (
    -- Personal Meals
    (kitchen_id IS NULL AND user_id = auth.uid()::text)
    OR
    -- Shared Meals (if your app supports it)
    (kitchen_id IS NOT NULL AND is_kitchen_member(kitchen_id))
);
