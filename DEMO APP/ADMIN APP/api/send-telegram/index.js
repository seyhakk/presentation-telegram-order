export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chat_id, text, parse_mode } = req.body;

    if (!chat_id) {
      return res.status(400).json({ error: 'chat_id is required' });
    }

    const botToken = '8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw';
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: text || 'Hello from Admin Panel!',
        parse_mode: parse_mode || 'HTML'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      return res.status(400).json({ error: result.description });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
}