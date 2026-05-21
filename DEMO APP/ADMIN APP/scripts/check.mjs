import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://onvhmwjhiydhzirfcatp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ'
);

for (const table of ['delivery_staff', 'coupons', 'reservations']) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  console.log(`${table}:`, error ? error.message : 'OK (${data.length} rows)');
}
