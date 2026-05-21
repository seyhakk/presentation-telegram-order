export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const botToken = '8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw';
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${user_id}`);
    const result = await response.json();

    if (!result.ok) {
      return res.status(400).json({ error: result.description });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        id: result.result.id,
        first_name: result.result.first_name,
        last_name: result.result.last_name || null,
        username: result.result.username || null,
        bio: result.result.bio || null
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}