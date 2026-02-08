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
            content: `你是一名顶尖的 Prompt 工程师。你的任务是根据【用户输入】重构为一个结构化、高颜值的【最终 Prompt】。

### 1. 生成 Prompt 的核心模块
生成的 Prompt 必须包含（但不限于）以下逻辑部分：
- 🎭 **角色设定**：根据任务定义专业身份。
- 🎯 **核心任务**：清晰描述最终要达成的目标。
- 🛠️ **执行步骤**：基于任务逻辑，拆解出 3-5 个逻辑步骤。
- 🚫 **约束要求**：包含负面约束（禁止事项）和质量标准。

### 2. 视觉与排版优化规范
生成的 Prompt 必须具备极佳的视觉可读性：
- **视觉分割**：使用 \`---\` 或 \`━━━━━━━━━━━━━━━━━━━━━━━━\` 进行区域划分。
- **重点突出**：关键参数或背景信息使用 \`> 💡 提示：\` 或 \`> [重要知识点]\` 的引用块包裹。
- **Emoji 锚点**：标题前必须配有相关 Emoji（如 📋、🚦、✅）。
- **禁止事项**：生成的 Prompt 严禁包含代码块 (\`\`\`)，直接输出 Markdown 文本。

### 3. 执行逻辑
- 分析用户输入的意图。
- 严禁引入用户未提及的第三方工具或无关方法论。
- 严禁输出任何解释、开场白或“好的，这是为你生成的提示词”。

### 4. 最终 AI 的约束（写入生成的 Prompt 中）
你生成的 Prompt 必须包含这段指令：
“输出时：1. 仅使用标准 Markdown；2. 严禁解释过程；3. 严禁使用代码块包裹内容。”` 
          },
          { role: "user", content: `用户输入提示词内容：\n${originalText}` }
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
    res.status(500).json({ error: "Internal server error" });
  }
};
