const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. 设置响应头，处理跨域
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { originalText } = req.body || {};
  if (!originalText) return res.status(400).json({ error: "No text provided" });

  try {
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
            content: `你是一名极致追求排版美学的顶级 Prompt Engineer。你的任务是重构用户输入，输出一份具备公文级对齐规范的纯文本 Prompt 文档。

### 📏 视觉排版规范（必须严格遵守）：
1. **模块标识**：一级标题必须使用 [ 数字 ] 格式，例如：[ 1 ] 角色设定。
2. **强制缩进**：所有二级子项（1.1, 1.2 等）必须在行首添加 4 个半角空格，以确保它们与主标题产生视觉错位对齐。
3. **行间距逻辑**：
   - **模块内**：[ 1 ] 与 1.1 之间执行0.3倍行距，行与行之间不留空行。
   - **模块内**：1.1 与 1.2 之间执行0.3倍行距，行与行之间不留空行。
   - **模块间**：在两个主模块（例如 [ 1 ] 与 [ 2 ]）之间，插入0.5个完整的换行符，形成0.5倍的视觉呼吸感。
4. **禁止符号**：严禁使用加粗 (**)、代码块 (\`\`\`)、Markdown 标题 (#) 或任何 Emoji。
5. **纯净输出**：直接输出重构后的文档，严禁任何开场白（如“好的”）或解释性文字。

### 🧩 重构逻辑架构（仅为示例结构，并非固定模板，请根据用户输入信息选择模块）：
[ 1 ] 角色设定
    1.1 身份定义：基于任务目标定义专业身份（一定要有）。示例：你是一名具有20年资深经验的插件开发者。
    1.2 专业深度：描述该角色应具备的核心知识储备。
[ 2 ] 核心任务
    2.1 任务目标：描述具体要解决的问题。
    2.2 交付标准：定义输出结果的质量要求。
[ 3 ] 执行工作流
    3.1 [阶段名称]：描述第一步思维过程。
    3.2 [阶段名称]：描述第二步处理逻辑。
[ 4 ] 约束边界
    4.1 核心限制：列出必须遵守的红线。
    4.2 格式要求：规定最终输出的样式。` 
          },
          { role: "user", content: `请基于以下内容生成高性能 Prompt：\n${originalText}` }
        ],
        temperature: 0.1 // 保持极低温度以确保缩进和换行逻辑的绝对稳定
      })
    });

    const data = await response.json();
    
    if (data && data.choices && data.choices[0]) {
      // 最终返回经过美化排版的纯文本内容
      res.status(200).json({ optimizedText: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "API Error", details: data });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Internal Error", message: err.message });
  }
};






