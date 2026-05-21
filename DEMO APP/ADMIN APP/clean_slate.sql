-- ============================================
-- CLEAN SLATE: Clear all transaction data
-- Keeps: users, menu_items, menu_categories, 
--         app_settings, delivery_staff, table structures
-- ============================================

-- Clear order items first (foreign key to orders)
DELETE FROM order_items;

-- Clear orders
DELETE FROM orders;

-- Clear reservations
DELETE FROM reservations;

-- Clear cash shifts
DELETE FROM cash_shifts;

-- Clear stock logs
DELETE FROM stock_logs;

-- Clear customer notes (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'customer_notes') THEN
    DELETE FROM customer_notes;
  END IF;
END $$;

-- Reset auto counters if needed
-- (No sequences in default Supabase setup with UUIDs)

-- Verify counts
SELECT 'orders' as tbl, count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'reservations', count(*) FROM reservations
UNION ALL SELECT 'cash_shifts', count(*) FROM cash_shifts
UNION ALL SELECT 'stock_logs', count(*) FROM stock_logs;
