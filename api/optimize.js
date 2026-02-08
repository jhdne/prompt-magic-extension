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
            content: `你是一名 Prompt 工程师。你的唯一任务是根据【用户输入的提示词】生成一个【用于生成最终内容的 Prompt】。

### 核心任务
生成一个 Prompt，使其被执行时能输出结构清晰、可直接渲染的 Markdown 内容。你不是在生成内容本身，而是在编写指令。

### 核心规则
1. **内容一致性**：生成的 Prompt 必须以“用户输入的提示词”为唯一内容依据，不得引入未在输入中隐含或明确出现的结构假设。
2. **格式约束**：生成的 Prompt 必须明确要求最终 AI：
   - 仅使用标准 Markdown 输出，禁止使用代码块（\`\`\`）。
   - 禁止解释格式、思路或生成过程。
3. **结构推导**：生成的 Prompt 必须基于用户输入推导出最合理的标题层级、列表形式（有序/无序）、是否使用引用或表格。
4. **灵活性**：禁止在 Prompt 中写死具体内容或预设固定的章节名称，必须保持框架的通用性。

### 输出要求
- 仅输出【最终可直接使用的 Prompt】。
- 不添加任何解释、注释或前后说明。
- 不使用代码块包裹输出内容。
- Prompt 本身使用 Markdown 排版。` 
          },
          { role: "user", content: `现在，请基于以下【用户输入提示词】生成对应的 Prompt：\n${originalText}` }
        ],
        temperature: 0.4 // 稍微降低温度以提高指令遵循的稳定性
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
