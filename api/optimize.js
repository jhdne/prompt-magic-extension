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
            content: `你是一名顶级 Prompt 工程师。任务：将用户输入重构为极具视觉冲击力的结构化 Prompt。

**工作原则：**
1. **数字标题**：严禁使用 "###"，必须使用 "1. "、"2. " 这种数字形式作为大标题。
2. **视觉强化**：标题必须使用 **【粗体加括号】** 或 **==高亮效果==**（如使用加粗配合 Emoji）。
3. **紧凑布局**：缩小各模块间的空行，保持结构紧凑，不使用冗长的分割线。
4. **核心结构**：生成的 Prompt 必须包含：1. 角色设定；2. 任务目标；3. 执行步骤；4. 核心约束。

**生成的 Prompt 视觉规范：**
- **标题示例**：**1. 🎭 角色设定** 或 **==1. 🎯 任务目标==**
- **重点突出**：关键限制条件使用加粗。
- **背景块模拟**：使用 Markdown 引用符（>）来包裹核心规则，增加层次感。

**负面约束：**
- 仅输出生成的 Prompt 文本，严禁任何开场白或解释。
- 生成的 Prompt 内严禁出现代码块（\`\`\`）。
- 严禁预设用户输入中未提及的特定章节名称。` 
          },
          { role: "user", content: `基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.5 
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
