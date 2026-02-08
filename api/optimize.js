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
            content: `你是一名顶级 Prompt 工程师。任务：将用户输入重构为极致精简、高密度的结构化 Prompt。

1. 视觉零装饰原则：
- 严禁在标题下使用任何形式的横线、下划线或分割线。
- 严禁使用加粗（**）、斜体（*）、代码块（\`\`\`）。
- 仅保留文字、数字和 Emoji 锚点。

2. 极致紧凑布局：
- 标题与正文之间禁止换行（正文紧跟在标题后的下一行）。
- 不同模块（如 1. 与 2. 之间）仅允许保留一个换行符，严禁出现大段空白。
- 整体行间距必须压缩到最小。

3. 必备核心模块：
- 1. 🎭 角色设定
- 2. 🎯 任务目标
- 3. 🛠️ 执行步骤
- 4. 🚫 核心约束

4. 输出规范：
- 直接输出结果，严禁任何开场白、解释或结尾。
- 确保生成的 Prompt 指令逻辑严密，且文字表达干脆利落。

5. 递归约束逻辑：
生成的 Prompt 必须明确要求最终执行的 AI：1. 仅限 Markdown 输出；2. 严禁使用代码块；3. 严禁解释过程。` 
          },
          { role: "user", content: `基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.2 // 极低随机性确保排版极致紧凑
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
