-- ============================================
-- COMBINED IDEMPOTENT MIGRATION
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
-- gen_random_uuid() is built-in in Supabase Postgres.
-- No extensions to enable.


-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- 2.1 menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price_pickup DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_pickup >= 0),
    price_delivery DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_delivery >= 0),
    image_emoji TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT DEFAULT 'Guest',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    customer_note TEXT DEFAULT '',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','delivering','dining','completed','cancelled')),
    order_type TEXT CHECK (order_type IN ('pickup','delivery','dine_in','takeaway')),
    telegram_user_id BIGINT,
    telegram_username TEXT,
    telegram_id TEXT,
    telegram_first_name TEXT,
    customer_lat DOUBLE PRECISION,
    customer_lng DOUBLE PRECISION,
    assigned_driver_id TEXT,
    assigned_driver_name TEXT,
    assigned_driver_username TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 2.6 app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 stock_logs
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'manual',
    reference_id TEXT,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- 3. ALTER TABLE MIGRATIONS
-- ============================================

-- 3.1 Rename old price column to price_pickup if it still exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='price') THEN
    ALTER TABLE menu_items RENAME COLUMN price TO price_pickup;
  END IF;
END $$;

-- 3.2 Ensure all columns exist on menu_categories
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;

-- 3.3 Ensure all columns exist on menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_pickup DECIMAL(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_delivery DECIMAL(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- 3.4 Ensure all columns exist on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_first_name TEXT;

-- 3.5 Ensure all columns exist on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 3.6 Ensure constraints on menu_items
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_price_check;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS price_delivery_check;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS price_pickup_check;
ALTER TABLE menu_items ADD CONSTRAINT price_pickup_check CHECK (price_pickup >= 0);
ALTER TABLE menu_items ADD CONSTRAINT price_delivery_check CHECK (price_delivery >= 0);

-- 3.7 Seed delivery price from pickup if still null (for tables created before price_delivery existed)
UPDATE menu_items SET price_delivery = price_pickup WHERE price_delivery IS NULL;
ALTER TABLE menu_items ALTER COLUMN price_pickup SET NOT NULL;
ALTER TABLE menu_items ALTER COLUMN price_delivery SET NOT NULL;

-- User profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Cost tracking
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Delivery staff fields
ALTER TABLE delivery_staff ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE delivery_staff ADD COLUMN IF NOT EXISTS commission DECIMAL(10,2) DEFAULT 0;


-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_stock ON menu_items(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item ON stock_logs(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created ON stock_logs(created_at DESC);


-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- 5.1 menu_categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON menu_categories;
DROP POLICY IF EXISTS "Anyone can read menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated can manage menu_categories" ON menu_categories;
CREATE POLICY "Anyone can read menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage menu_categories" ON menu_categories FOR ALL USING (true);

-- 5.2 menu_items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read menu_items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated can manage menu_items" ON menu_items;
CREATE POLICY "Anyone can read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage menu_items" ON menu_items FOR ALL USING (true);

-- 5.3 orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated can manage orders" ON orders;
CREATE POLICY "Anyone can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage orders" ON orders FOR ALL USING (true);

-- 5.4 order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated can manage order_items" ON order_items;
CREATE POLICY "Anyone can read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage order_items" ON order_items FOR ALL USING (true);

-- 5.5 users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Anyone can delete users" ON users;
DROP POLICY IF EXISTS "Admin full access users" ON users;
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete users" ON users FOR DELETE USING (true);
CREATE POLICY "Admin full access users" ON users FOR ALL USING (true);

-- 5.6 app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Authenticated can manage app_settings" ON app_settings;
CREATE POLICY "Anyone can read app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage app_settings" ON app_settings FOR ALL USING (true);

-- 5.7 stock_logs
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access stock_logs" ON stock_logs;
DROP POLICY IF EXISTS "Anyone can read stock_logs" ON stock_logs;
CREATE POLICY "Admin full access stock_logs" ON stock_logs FOR ALL USING (true);
CREATE POLICY "Anyone can read stock_logs" ON stock_logs FOR SELECT USING (true);


-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- 6.1 Auto-decrement stock when order_items are created
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    prev_qty INTEGER;
    auto_mode TEXT;
    new_qty INTEGER;
BEGIN
    SELECT value INTO auto_mode FROM app_settings WHERE key = 'stock_auto_mode';
    IF auto_mode = 'off' OR auto_mode IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT stock_quantity INTO prev_qty FROM menu_items WHERE id = NEW.menu_item_id;
    new_qty := GREATEST(prev_qty - NEW.quantity, 0);

    UPDATE menu_items
    SET stock_quantity = new_qty,
        available = CASE WHEN new_qty <= 0 THEN false ELSE available END
    WHERE id = NEW.menu_item_id;

    INSERT INTO stock_logs (menu_item_id, change_amount, reason, reference_id, previous_quantity, new_quantity)
    VALUES (NEW.menu_item_id, -NEW.quantity, 'order', NEW.order_id::text, prev_qty, new_qty);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Trigger on order_items insert
DROP TRIGGER IF EXISTS trigger_stock_decrement ON order_items;
CREATE TRIGGER trigger_stock_decrement
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION decrement_stock_on_order();


-- ============================================
-- 7. STORAGE BUCKET
-- ============================================

-- 7.1 Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7.2 Storage policies
DROP POLICY IF EXISTS "Anyone can upload menu images" ON storage.objects;
CREATE POLICY "Anyone can upload menu images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can update menu images" ON storage.objects;
CREATE POLICY "Anyone can update menu images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can delete menu images" ON storage.objects;
CREATE POLICY "Anyone can delete menu images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;
CREATE POLICY "Anyone can view menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');


-- ============================================
-- 8. DATA SEEDS
-- ============================================

-- 8.1 Default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye0WjZ9cKqLQv0F8LhL1X3K5L6J8K9L0', 'Admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 8.2 Default permissions for admin
UPDATE users SET permissions = '{
  "dashboard": true,
  "orders": true,
  "reports": true,
  "stock": true,
  "menu": true,
  "dinein_security": true,
  "customers": true,
  "riders": true,
  "reservations": true,
  "profile": true,
  "settings": true,
  "users": true
}'::jsonb WHERE role = 'admin';

-- Default permissions for regular user
UPDATE users SET permissions = '{
  "dashboard": true,
  "orders": false,
  "reports": false,
  "stock": false,
  "menu": false,
  "customers": false,
  "riders": false,
  "reservations": false,
  "profile": true,
  "settings": false,
  "users": false
}'::jsonb WHERE role = 'user';

-- 8.3 stock_auto_mode setting (controls automatic stock decrement on orders)
INSERT INTO app_settings (key, value, description)
VALUES ('stock_auto_mode', 'on', 'Controls automatic stock decrement on orders')
ON CONFLICT (key) DO NOTHING;

-- 8.4 Initial stock seed — set defaults for all items
UPDATE menu_items SET stock_quantity = 100, low_stock_threshold = 10;

-- Adjust stock for popular items based on known sales data
UPDATE menu_items
SET stock_quantity = CASE name
    WHEN 'Chicken Cartilage' THEN 17
    WHEN 'ChickenThigh Skewer' THEN 18
    WHEN 'Chicken Wing' THEN 43
    WHEN 'Pork Belly (10)' THEN 45
    WHEN 'Soft Bone Rib' THEN 46
    WHEN 'Chicken Gizzard (05)' THEN 46
    WHEN 'Khmer Beef' THEN 48
    WHEN 'Beef Heart (22)' THEN 48
    WHEN 'Shrimp' THEN 48
    ELSE stock_quantity
END,
low_stock_threshold = CASE name
    WHEN 'Chicken Cartilage' THEN 25
    WHEN 'ChickenThigh Skewer' THEN 25
    ELSE low_stock_threshold
END
WHERE name IN ('Chicken Cartilage','ChickenThigh Skewer','Chicken Wing','Pork Belly (10)','Soft Bone Rib','Chicken Gizzard (05)','Khmer Beef','Beef Heart (22)','Shrimp');

-- 8.5 Sync stock from actual order_items data (recalculates based on real sales)
UPDATE menu_items SET stock_quantity = 100, low_stock_threshold = 10;

UPDATE menu_items mi
SET stock_quantity = GREATEST(mi.stock_quantity - sold.total_sold, 0)
FROM (
    SELECT menu_item_id, SUM(quantity) as total_sold
    FROM order_items
    GROUP BY menu_item_id
) AS sold
WHERE mi.id = sold.menu_item_id;

-- Set higher thresholds for popular items (sold 20+ units)
UPDATE menu_items
SET low_stock_threshold = 25
WHERE stock_quantity <= 70 AND stock_quantity > 0;

-- Auto-hide items that are out of stock
UPDATE menu_items SET available = false WHERE stock_quantity <= 0;


-- ============================================
-- 9. NEW TABLES (Customers, Riders, Coupons, Reservations)
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_order DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 0,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    guest_count INTEGER NOT NULL DEFAULT 1,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE delivery_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read delivery_staff" ON delivery_staff;
DROP POLICY IF EXISTS "Authenticated can manage delivery_staff" ON delivery_staff;
CREATE POLICY "Anyone can read delivery_staff" ON delivery_staff FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage delivery_staff" ON delivery_staff FOR ALL USING (true);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read coupons" ON coupons;
DROP POLICY IF EXISTS "Authenticated can manage coupons" ON coupons;
CREATE POLICY "Anyone can read coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage coupons" ON coupons FOR ALL USING (true);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated can manage reservations" ON reservations;
CREATE POLICY "Anyone can read reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage reservations" ON reservations FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================
-- 2.15 cash_shifts
-- ============================================
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    shift_type TEXT NOT NULL DEFAULT 'cash',
    opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    closing_amount DECIMAL(10,2),
    difference DECIMAL(10,2),
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can manage cash_shifts" ON cash_shifts;
CREATE POLICY "Anyone can manage cash_shifts" ON cash_shifts FOR ALL USING (true);

-- ============================================
-- 2.16 customer_notes
-- ============================================
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    name TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can manage customer_notes" ON customer_notes;
CREATE POLICY "Anyone can manage customer_notes" ON customer_notes FOR ALL USING (true);
