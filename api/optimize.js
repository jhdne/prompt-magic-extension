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
    const response = await fetch("[https://integrate.api.nvidia.com/v1/chat/completions](https://integrate.api.nvidia.com/v1/chat/completions)", {
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
            content: `你是一名顶级的 Prompt Engineer 专家。任务：将用户输入重构为纯净、严谨、多层级的专业 Prompt 文档。

### 📋 格式与排版规范：
1. **禁止代码块**：严禁输出 \`\`\`markdown 或任何包裹符号。直接输出文本内容。
2. **数字层级**：禁止使用 # 标题。统一使用数字编号，例如：
   1. [模块名称]
   1.1 [子模块]
3. **行间距控制**：
   - 模块内部（正文部分）：使用单倍行距，行与行之间不留空行。
   - 模块与模块之间（例如 1 与 2 之间）：保留两个换行符，以模拟 1.5 倍的视觉间距。
4. **视觉净化**：禁止使用粗体 (**)、斜体 (*)、或容易触发编辑器下划线的特殊符号。

### 🧩 提示词逻辑架构：
1. 角色设定：定义 AI 的身份、专业领域及思维模式。
2. 核心任务：量化目标及期望达成的最终结果。
3. 执行步骤：提供清晰的逻辑链条（1.1, 1.2, 1.3...）。
4. 约束边界：明确禁止项及输出格式要求。

### 🚫 负面约束：
- 严禁任何开场白、结束语或“好的，这是为您生成的”等废话。
- 严禁解释重构逻辑。
- 最终输出必须看起来像一份直接可用的专业文档。` 
          },
          { role: "user", content: `请基于以下内容，为我生成一个高性能的结构化 Prompt：\n${originalText}` }
        ],
        temperature: 0.2 
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      // 这里的 optimizedText 现在将是纯净的、无代码块包裹的字符串
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
