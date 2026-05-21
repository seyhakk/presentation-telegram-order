#!/bin/bash
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   RESTAURANT ADMIN PANEL SETUP      ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Prerequisites:"
echo "  1. Supabase project created (get URL + anon key)"
echo "  2. Telegram bot via @BotFather (get token + username)"
echo "  3. Vercel CLI (npm i -g vercel && vercel login)"
echo ""
read -p "Restaurant Name: " RESTAURANT_NAME
read -p "Admin Username: " ADMIN_USER
read -s -p "Admin Password: " ADMIN_PASS
echo ""
read -p "Admin Full Name: " ADMIN_FULLNAME
read -p "Bot USERNAME (e.g. myrestaurant_bot): " BOT_USERNAME
read -p "Bot TOKEN: " BOT_TOKEN
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
echo ""
echo "─────────────────────────────────────"
read -p "Proceed? (y/n): " CONFIRM
[[ "$CONFIRM" != "y" ]] && echo "Cancelled." && exit 0

# Update supabase.js
sed -i '' "3s|.*|const SUPABASE_URL = '$SUPABASE_URL';|" src/lib/supabase.js
sed -i '' "4s|.*|const SUPABASE_ANON_KEY = '$SUPABASE_ANON_KEY';|" src/lib/supabase.js
echo "✅ Supabase config updated"

# Update bot token in all API files
for f in api/telegram-webhook/index.js api/send-telegram/index.js api/send-daily-report/index.js api/get-telegram-user/index.js; do
  sed -i '' "s|8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw|$BOT_TOKEN|g" "$f" 2>/dev/null
done
echo "✅ Bot token replaced"

# Update sidebar
sed -i '' "s|Admin Panel|$RESTAURANT_NAME|g" src/components/Sidebar.jsx
echo "✅ Branding: $RESTAURANT_NAME"

echo ""
echo "─────────────────────────────────────"
echo "  NEXT: Run migration.sql in Supabase SQL Editor"
echo "  Then run this SQL to create admin + settings:"
echo ""
cat << SQL
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('$ADMIN_USER', '$ADMIN_PASS', '$ADMIN_FULLNAME', 'admin')
ON CONFLICT (username) DO UPDATE SET password_hash = '$ADMIN_PASS';
INSERT INTO app_settings (key, value) VALUES
  ('restaurant_name', '$RESTAURANT_NAME'),
  ('bot_username', '$BOT_USERNAME'),
  ('report_bot_token', '$BOT_TOKEN')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
SQL
echo ""
echo "  Then: npx vercel deploy --prod"
echo "  Then set webhook: https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=<URL>/api/telegram-webhook"
echo ""
echo "✅ Credentials: $ADMIN_USER / $ADMIN_PASS  |  Bot: @$BOT_USERNAME"
