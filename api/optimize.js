const fetch = require('node-fetch');

const SUPABASE_URL = 'https://mtuuwxcqvlcfgchaffee.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY; // 确保在环境变量中设置了此项

module.exports = async (req, res) => {
  // --- 跨域与基础验证 ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: 'No text provided' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    // 1. 验证 Supabase 用户身份
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': authHeader
      }
    });

    if (!userRes.ok) return res.status(401).json({ error: 'Invalid token.' });
    const user = await userRes.json();

    // 2. 查询积分 (使用 rpc 或直接查询)
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
    const currentCredits = Array.isArray(creditsData) && creditsData.length > 0
      ? creditsData[0].credits : 0;

    if (currentCredits <= 0) {
      return res.status(402).json({ error: 'Insufficient credits.' });
    }

    // 3. 调用 NVIDIA API (替换点)
    // 根据你的模型替换需求，设置相应的 model, temp, top_p 等
    const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-coder-32b-instruct",
        messages: [
          {
            role: 'system',
            content: '你是一个提示词专家。请将用户输入的原始命令重构为高质量 Prompt。要求：1.赋予专业角色；2.增加结构化指令（背景、任务、限制、输出格式）；3.提升表达专业度。直接返回优化后的结果，禁止任何开场白或解释。'
          },
          { role: 'user', content: originalText }
        ],
        temperature: 0.2, // 参考你提供的 Python 片段
        top_p: 0.7,       // 参考你提供的 Python 片段
        max_tokens: 1024
      })
    });

    const aiData = await nvidiaResponse.json();
    
    // 检查 NVIDIA 响应错误
    if (!nvidiaResponse.ok || !aiData.choices) {
      console.error('NVIDIA Error:', aiData);
      return res.status(500).json({ error: 'AI Service Error', details: aiData.error });
    }

    const optimizedResult = aiData.choices[0].message.content;

    // 4. 扣除积分 (建议在生产环境使用 RPC 以保证原子性，这里沿用你的 PATCH 逻辑)
    const newCredits = currentCredits - 1;
    await fetch(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ credits: newCredits })
      }
    );

    // 5. 返回结果
    return res.status(200).json({
      optimizedText: optimizedResult,
      creditsRemaining: newCredits
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
