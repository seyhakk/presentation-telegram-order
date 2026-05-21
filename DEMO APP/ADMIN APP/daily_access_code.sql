-- ============================================
-- Daily Access Code System for Dine-In Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS daily_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    code_hash TEXT NOT NULL,
    display_hint TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT DEFAULT ''
);

-- 2. RLS
ALTER TABLE daily_access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read daily_access_codes" ON daily_access_codes;
DROP POLICY IF EXISTS "Authenticated can manage daily_access_codes" ON daily_access_codes;

CREATE POLICY "Anyone can read daily_access_codes" ON daily_access_codes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage daily_access_codes" ON daily_access_codes
    FOR ALL USING (true);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_daily_access_codes_date ON daily_access_codes(code_date DESC);

-- 4. RPC: Save today's access code (hashed)
CREATE OR REPLACE FUNCTION save_daily_access_code(input_code TEXT, admin_name TEXT DEFAULT '')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO daily_access_codes (code_date, code_hash, display_hint, updated_by)
    VALUES (
        CURRENT_DATE,
        encode(sha256(input_code::bytea), 'hex'),
        input_code,
        admin_name
    )
    ON CONFLICT (code_date)
    DO UPDATE SET
        code_hash = encode(sha256(input_code::bytea), 'hex'),
        display_hint = input_code,
        updated_at = NOW(),
        updated_by = admin_name,
        is_active = true;

    RETURN true;
END;
$$;

-- 5. RPC: Verify a code against today's stored hash
CREATE OR REPLACE FUNCTION verify_daily_access_code(input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT code_hash INTO stored_hash
    FROM daily_access_codes
    WHERE code_date = CURRENT_DATE AND is_active = true;

    IF stored_hash IS NULL THEN
        RETURN false;
    END IF;

    RETURN stored_hash = encode(sha256(input_code::bytea), 'hex');
END;
$$;

-- 6. RPC: Get today's code details (for admin display)
CREATE OR REPLACE FUNCTION get_today_access_code()
RETURNS TABLE (
    code_date DATE,
    display_hint TEXT,
    is_active BOOLEAN,
    updated_at TIMESTAMPTZ,
    updated_by TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT d.code_date, d.display_hint, d.is_active, d.updated_at, d.updated_by
    FROM daily_access_codes d
    WHERE d.code_date = CURRENT_DATE
    LIMIT 1;
END;
$$;
