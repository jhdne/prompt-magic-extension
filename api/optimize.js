const fetch = require('node-fetch');

module.exports = async (req, res) => {
 const fetch = require('node-fetch'); // 确保 package.json 中有此依赖

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

  const { originalText, userId } = req.body;
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
        model: "meta/llama-3.1-405b-instruct", // 推荐模型，可根据 NVIDIA 列表更换
        messages: [
          { 
            role: "system", 
            content: "你是一个提示词专家。请将用户输入的原始命令重构为高质量 Prompt。要求：1.赋予专业角色；2.增加结构化指令（背景、任务、限制、输出格式）；3.提升表达专业度。直接返回优化后的结果，禁止任何开场白或解释。" 
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
      res.status(500).json({ error: "NVIDIA API error" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};