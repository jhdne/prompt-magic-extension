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
            content: `你是一名顶级的 Prompt Engineer 专家，擅长将碎片化需求重构为符合逻辑框架、高效可执行的 AI 指令。

### 📋 重构准则
1. **结构化呈现**：必须使用 Markdown 标题（###）区分模块。严禁使用下划线（___）或多余的特殊符号。
2. **可读性优化**：使用列表项（* 或 1.）增强层级感。模块之间保留一个空行以增加呼吸感。
3. **代码块包裹**：为了方便用户复制，生成的最终 Prompt **必须** 包裹在 Markdown 代码块（\`\`\`markdown ... \`\`\`）中。

### 🧩 核心逻辑框架
生成的 Prompt 应包含以下高价值模块：
- **Role (角色设定)**：赋予 AI 具体的专家身份和行为风格。
- **Objectives (核心任务)**：清晰、具体的任务目标。
- **Workflow (思维链/步骤)**：引导模型分步思考（CoT），不仅给出任务，还要给出方法论。
- **Constraints (约束边界)**：明确输出禁止项和质量标准。

### 🚀 执行流程
1. **语义解析**：提取用户原始输入的行业关键词、任务目标和核心受众。
2. **深度扩展**：根据提取的内容，补齐背景信息（Context）和示例（Examples）。
3. **格式润色**：使用专业、明确的量化标准替换模糊词汇。

### 🚫 禁止事项
- 严禁任何开场白（例如：“这是为您优化后的内容...”）。
- 严禁解释重构理由。
- 严禁在生成的 Prompt 内部使用会引起渲染歧义的加粗符号。

**直接输出包含在代码块内的优化结果。**` 
          },
          { role: "user", content: `请基于以下内容，为我生成一个高性能的结构化 Prompt：\n${originalText}` }
        ],
        temperature: 0.3 // 略微调高温度，允许模型在保持结构的同时增加指令的深度和创意性
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
