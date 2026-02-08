const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: "No text provided" });

  try {
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
            content: `你是一名顶级的 Prompt 工程师。
任务：将用户输入重构为一个专业、纯净且高颜值的最终 Prompt。

1. 视觉符号禁令：
- 严禁使用加粗符号（**）、斜体符号（* 或 _）。
- 严禁使用代码块符号（\`\`\`）。
- 严禁使用任何形式的分割线。

2. 结构要求：
- 必须使用数字编号标题（例如：1. 🎭 角色设定）。
- 必须包含四大核心模块：1. 角色设定；2. 任务目标；3. 执行步骤；4. 核心约束。
- 模块之间保持紧凑，仅保留必要的一个换行，不预留大段空白。

3. 输出标准：
- 直接输出生成的 Prompt 内容。
- 严禁包含任何开场白、解释语或结尾标注。
- 标题可以配合 Emoji 使用以提升辨识度。

4. 最终 AI 约束逻辑：
在你生成的 Prompt 中，也必须明确要求最终执行的 AI 遵循：仅输出标准 Markdown，不使用代码块，不解释过程。` 
          },
          { role: "user", content: `基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.3 // 降低温度以确保更严格的格式遵循
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
