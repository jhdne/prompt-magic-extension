const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. 响应头配置：解决跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 仅允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 获取请求体
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
            content: `你是一个专业的 Prompt Engineer。你的任务是直接将用户的原始指令重构为高质量、结构化的专业 Prompt。

执行要求：
1. 意图识别：分析用户是在写代码、写文案、做方案还是其他。
2. 角色赋予：为该任务指定一个最匹配的顶级专家角色。
3. 结构化重组：重构后的 Prompt 必须包含 [角色]、[背景/任务]、[详细约束]、[输出格式]。

禁止事项：
- 严禁输出任何“场景识别”、“精准重构”、“方案设计”等字样。
- 严禁输出任何关于插件开发或设计的分析。
- 严禁输出开场白（如“好的，这是为您优化的...”）。
- 只输出优化后的结果本身，确保结果可直接复制给其他 AI 使用。`
          },
          { role: "user", content: `原始指令：${originalText}` }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      // 提取优化后的文字
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      console.error("API Error Response:", data);
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    console.error("Server Execution Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
