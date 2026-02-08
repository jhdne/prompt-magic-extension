// 注意：如果你使用 node-fetch v3，必须使用 import。
// 如果你坚持使用 require，请确保安装的是 v2 版本：npm install node-fetch@2
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: "No text provided" });

  try {
    // 修复点 1：清理 URL，去除 Markdown 链接干扰
    const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

    const response = await fetch(API_URL, {
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
            content: `你是一名顶级的 Prompt Engineer 专家。任务：将用户输入重构为纯净、严谨、数字层级的专业文档。

### 📋 排版规范：
1. 禁止代码块：严禁输出任何 \`\`\` 符号。直接输出纯文本。
2. 数字层级：统一使用数字编号（1, 1.1, 1.2）。禁止使用 # 标题、Emoji 或加粗符号。
3. 间距控制：
   - 模块内正文：单倍行距（行间无空行）。
   - 模块间：在两个数字模块（如 1 与 2）之间必须插入两个换行符，确保 1.5 倍的视觉间距。

### 🧩 结构标准：
1. 角色设定
1.1 身份定义及专业深度。
2. 核心任务
2.1 任务目标及交付标准。
3. 执行工作流
3.1 具体的思维链条或处理步骤。
4. 约束边界
4.1 限制条件及负面约束。

### 🚫 负面约束：
- 严禁任何解释语、开场白或符号说明。直接输出重构内容。` 
          },
          { role: "user", content: `请基于以下内容生成 Prompt：\n${originalText}` }
        ],
        temperature: 0.2 
      })
    });

    const data = await response.json();
    
    // 修复点 2：增强 API 返回结果的容错判断
    if (data && data.choices && data.choices[0]) {
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      console.error("API Error Response:", data);
      res.status(500).json({ error: "NVIDIA API error", details: data });
    }
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};
