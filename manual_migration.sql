-- Run this in your Supabase SQL Editor if the local migration script fails due to connection timeouts
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_calories INTEGER DEFAULT 2000;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_protein INTEGER DEFAULT 150;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_carbs INTEGER DEFAULT 250;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_fat INTEGER DEFAULT 70;
