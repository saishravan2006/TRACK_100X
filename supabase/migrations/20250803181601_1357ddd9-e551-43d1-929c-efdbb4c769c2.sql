-- Complete Database Reset - Drop All Tables and Schema
-- WARNING: This will delete ALL data in the database!

-- Drop all existing tables in the correct order to handle dependencies
DROP TABLE IF EXISTS public.payment_errors CASCADE;
DROP TABLE IF EXISTS public.payment_uploads CASCADE;
DROP TABLE IF EXISTS public.payments_archive CASCADE;
DROP TABLE IF EXISTS public.student_balances CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.update_student_balance() CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_payment_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_payment_status(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_balance_status() CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_data() CASCADE;
DROP FUNCTION IF EXISTS public.create_student_balance() CASCADE;

-- Drop all custom types/enums if any exist
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.class_type CASCADE;

-- Reset the public schema (this will remove all custom objects but keep the schema)
-- Note: We cannot drop the public schema itself as it's required by PostgreSQL

-- Clean up any remaining objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all remaining functions in public schema
    FOR r IN SELECT proname, oidvectortypes(proargtypes) as argtypes 
             FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'public' AND p.prokind = 'f'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || r.proname || '(' || r.argtypes || ') CASCADE';
    END LOOP;
    
    -- Drop all remaining tables in public schema
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || r.tablename || ' CASCADE';
    END LOOP;
    
    -- Drop all remaining views in public schema
    FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || r.viewname || ' CASCADE';
    END LOOP;
END $$;