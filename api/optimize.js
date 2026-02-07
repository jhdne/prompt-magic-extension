const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. 响应头配置：解决全平台跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 仅允许 POST 请求逻辑
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 获取请求体并进行安全检查
  const { originalText } = req.body || {};
  if (!originalText) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // 2. 调用 NVIDIA API
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
            content: `你是一个 Prompt Engineering 专家，专治模糊需求。

# 任务
将用户输入转化为可直接使用的专业提示词。

# 执行流程
1. **定领域**：提取关键词确定领域（技术/商业/创意/学术）。
2. **调结构**：按场景侧重模块：编程侧重输入与异常；创作侧重风格与情感；分析侧重逻辑链。
3. **填内容**：生成核心模块（角色/任务/流程/输出标准/约束）。
4. **做质检**：将“适当、优质”等模糊词替换为具体的量化标准。

# 输出标准
- **格式**：使用 Markdown 三级结构（#角色/##能力/###步骤）。
- **质量**：必须包含具体的“负面约束”（AI 不能做什么）和“量化指标”。
- **要求**：直接输出重构后的内容，严禁输出任何分析过程、开场白或解释文字。` 
          },
          { role: "user", content: `原始需求：${originalText}` }
        ],
        temperature: 0.5 // 降低随机性，确保结构严谨
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      // 成功返回重构后的高质量 Prompt
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
