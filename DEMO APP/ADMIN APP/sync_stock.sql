-- Run this ONCE in Supabase SQL Editor
-- Syncs stock_quantity with actual sales from existing order_items

-- 1. Reset all stock to 100 first
UPDATE menu_items SET stock_quantity = 100, low_stock_threshold = 10;

-- 2. Deduct based on actual sales
UPDATE menu_items mi
SET stock_quantity = GREATEST(mi.stock_quantity - sold.total_sold, 0)
FROM (
    SELECT menu_item_id, SUM(quantity) as total_sold
    FROM order_items
    GROUP BY menu_item_id
) AS sold
WHERE mi.id = sold.menu_item_id;

-- 3. Set higher thresholds for popular items (sold 20+ units)
UPDATE menu_items
SET low_stock_threshold = 25
WHERE stock_quantity <= 70 AND stock_quantity > 0;

-- 4. Auto-hide items that are out of stock
UPDATE menu_items SET available = false WHERE stock_quantity <= 0;

-- 5. Verify
SELECT name, stock_quantity, low_stock_threshold, available
FROM menu_items
WHERE stock_quantity <= 20
ORDER BY stock_quantity ASC;
