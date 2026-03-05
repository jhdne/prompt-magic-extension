const fetch = require('node-fetch');

const SUPABASE_URL = 'https://mtuuwxcqvlcfgchaffee.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // 1. 用 service key 验证用户 token，获取用户信息
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': authHeader
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await userRes.json();

    // 2. 查询用户积分
    const creditsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}&select=credits`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    const creditsData = await creditsRes.json();
    const credits = Array.isArray(creditsData) && creditsData.length > 0
      ? creditsData[0].credits
      : 0;

    return res.status(200).json({
      email: user.email,
      id: user.id,
      credits
    });

  } catch (err) {
    console.error('Profile API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

