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
            content: `你是一名极致视觉导向的 Prompt 工程师。任务：将用户输入重构为带严谨数字编号、关键点加粗、无冗余下划线的紧凑 Prompt。

1. 层级与视觉规范：
- 层级表达：必须使用数字编号（1. / 2. / 2.1 / 2.2）来区分。
- 重点突出：标题和关键点必须使用 **加粗** 或 \`行内代码背景\`。
- 严禁下划线：严禁使用 "#" 标题语法（防止渲染器生成下划线），改用加粗文字替代。
- 禁止代码块：严禁使用 \`\`\` 包裹输出。

2. 布局优化：
- 极致压缩：标题与正文位于同一行或紧随其后。
- 模块间距：模块之间仅保留一个换行，子项之间不留空行。

3. 结构化模板：
**1. 🎭 角色设定**：定义身份
**2. 🎯 任务目标**：定义目标
**3. 🛠️ 执行步骤**：
3.1 [关键步骤名]：具体描述
3.2 [关键步骤名]：具体描述
**4. 🚫 核心约束**：列出负面约束

4. 最终 AI 执行指令（必须写入生成的 Prompt 中）：
要求：1. 仅 Markdown 输出；2. 禁止代码块；3. 禁止解释过程；4. 标题保持加粗且无横线。

5. 负面约束：
直接输出内容，严禁任何开场白、解释语或符号说明。` 
          },
          { role: "user", content: `基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.2
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
