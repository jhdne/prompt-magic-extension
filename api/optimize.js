const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. 响应头配置：解决全平台跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 仅允许 POST 请求逻辑
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 安全获取请求体
  const { originalText } = req.body || {};
  if (!originalText) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // 2. 调用 NVIDIA API
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-405b-instruct",
        messages: [
          { 
            role: "system", 
            content: "你是一个资深AI“全能提示词”专家。请根据用户需求执行：1：识别场景：判断用户是在写代码、创作文案、设计方案还是其他。
2：精准重构：根据场景匹配最佳框架（如代码重逻辑，文案重情绪，方案重结构）。3：高质量输出：直接输出重构、优化后，可直接使用的高质量Prompt，MARKDOWN格式。" 
          },
          { role: "user", content: originalText }
        ],
        temperature: 0.6
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }

};
