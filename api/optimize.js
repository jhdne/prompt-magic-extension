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
            role: "system", // 必须是 system
            content: `你是一个资深提示词工程师 (Prompt Engineer)，专治模糊需求。
            
# 任务
将用户原始输入重构为高性能、结构化的专业提示词。

# 执行流程
1. **定领域**：提取关键词确定领域（技术/商业/创意/学术）。
2. **调结构**：按场景侧重模块。
3. **填内容**：生成核心模块（角色/任务/流程/输出标准/约束）。
4. **做质检**：将模糊词替换为具体的量化标准。

# 输出标准
- **格式**：使用 Markdown 三级结构（#角色/##能力/###步骤）。
- **质量**：必须包含具体的“负面约束”和“量化指标”。
- **要求**：直接输出重构后的内容，严禁输出任何分析过程、开场白或解释文字。

# 视觉设计说明：
使用 🔘、●、🛠️、🚦 等图标作为功能区锚点。使用 ━━━━━━━━ 模拟 UI 分割线。` 
          },
          { role: "user", content: `原始需求：${originalText}` }
        ],
        temperature: 0.5 
      })
    });

    const data = await response.json();
    
    // 增加数据结构检查
    if (data.choices && data.choices[0]) {
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      // 如果报错，把具体错误透传出来方便调试
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};



