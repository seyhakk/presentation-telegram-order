const PICKUP_BOT_TOKEN = '8707616318:AAHZydCWkN1L5KLf3SbBBHgH8nSf5L8JpSw';
const SUPABASE_URL = 'https://onvhmwjhiydhzirfcatp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ';

async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${PICKUP_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  return r.json();
}

async function supabasePatch(q, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(data)
  });
}

async function supabaseQuery(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { callback_query } = body;

    if (callback_query) {
      const data = callback_query.data;
      const msg = callback_query.message;

      await tg('answerCallbackQuery', { callback_query_id: callback_query.id });

      if (data.startsWith('prepare_')) {
        const orderId = data.replace('prepare_', '');

        await supabasePatch(`orders?id=eq.${orderId}`, { status: 'dining', updated_at: new Date().toISOString() });

        const originalText = msg?.text || msg?.caption || '';
        const updatedText = originalText + '\n\n✅ <b>Preparing — moved to dining</b>';

        try {
          await tg('editMessageText', {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            text: updatedText,
            parse_mode: 'HTML'
          });
        } catch (e) {
          console.warn('editMessageText failed:', e.message);
        }
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Pickup webhook error:', error);
    res.json({ ok: true });
  }
}
