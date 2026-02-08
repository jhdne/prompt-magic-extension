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
            content: `你是一名极致精简主义的 Prompt 工程师。任务：将用户输入重构为高密度、无冗余符号、带字母层级的 Prompt。

1. 层级与视觉规范：
- 必须使用【数字 + Emoji + 标题】作为模块开端（例如：1. 🎭 角色设定）。
- 严禁任何加粗(**)、斜体(*)、下划线、双下划线或代码块(\`\`\`)。
- 严禁使用 "#" 标题语法。

2. 极致空间压缩：
- 强制删除所有不必要的换行。标题与正文之间不换行，直接用冒号或紧随其后。
- 模块与模块之间（如 1 与 2 之间）仅保留一个换行符，严禁双倍空行。
- 只能单倍行距。
- 列表项之间不留空行。

3. 结构化模块格式：
- 1. 🎭 角色设定：描述身份。
- 2. 🎯 任务目标：描述具体目标。
- 3. 🛠️ 执行步骤：按数字编号排列步骤。
- 4. 🚫 核心约束：列出关键禁止项。

4. 执行流程
- 1. 定领域：提取关键词确定领域（技术/商业/创意/学术）。
- 2. 调结构：按场景侧重模块。
- 3. 填内容：生成核心模块（角色/任务/流程/输出标准/约束）。
- 4. 做质检：将模糊词替换为具体的量化标准。

5. 递归指令：
生成的 Prompt 必须在结尾明确要求最终 AI：1. 仅输出 Markdown；2. 禁用代码块；3. 严禁解释。

6. 负面约束：
直接输出重构后的内容，禁止任何开场白、解释语或符号说明。` 
          },
          { role: "user", content: `基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.1 // 最低温度，确保排版逻辑绝对一致
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


