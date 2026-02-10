const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 响应头处理
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
                        content: `你是一名顶尖的 Prompt 架构设计师。请根据用户输入的需求，按照以下严格的要求重构 Prompt。

### 🛠 第一阶段：意图识别与框架选择
观察用户需求，从以下三个架构中选择最匹配的一个：
- [架构A：专业生产力] 适用于：代码、分析、报告。核心强调：逻辑严密性、边界条件。
- [架构B：创意内容表达] 适用于：文案、剧本、设计建议。核心强调：感官细节、情感张力。
- [架构C：策略咨询引导] 适用于：决策、策划、复杂方案。核心强调：多维视角、可行性评估。

### 📐 第二阶段：排版排版规范（高压线）
1. 模块标识：使用 [ 数字 ] 标题（如 [ 1 ] 角色设定）。
2. 缩进控制：二级子项行首必须添加 4 个半角空格。
3. 密度控制（必须执行）：
   - 模块内部（如 1.1 与 1.2 之间）严禁任何空行。
   - 仅在 [ 数字 ] 标题上方保留一个空行，下方立即紧跟内容。
4. 符号禁令：严禁 Markdown 加粗 (**)、代码块 (\`\`\`)、# 号标题或 Emoji。

### 🧩 第三阶段：模块动态构建指南
[ 1 ] 角色设定：
    1.1 身份设定：基于任务目标定义一个具备验证背景的该领域前TOP1%专业专家身份。
    1.2 认知地图：描述该专家分析问题的方法论（如：第一性原理、SWOT等）。
[ 2 ] 任务目标：
    2.1 终极目标：透视用户表层需求后的深层业务目的，将用户模糊需求转化为具备专家思维链的高性能Prompt。
    2.2 交付标准：量化成功的指标（如：代码需考虑内存泄漏、文案需达到 3% 转化率风格）。
[ 3 ] 逻辑推理路径（针对逻辑/知识类必选）
    3.1 思考规约：要求 AI 在回答前必须先列出思维大纲或逻辑步骤。   
[ 4 ] 动态模块（根据第一阶段架构三选一）：
    - (若选架构A) [ 4 ] 执行规约：包含错误处理、输入验证、边界防御。
    - (若选架构B) [ 4 ] 语境设定：包含核心意象、受众心理画像、叙事视角。
    - (若选架构C) [ 4 ] 评估维度：包含成本限制、潜在风险、实施阶段建议。
[ 5 ] 约束红线：列出该领域最易犯的低级错误并强制禁止。规定语气、专业术语密度等。
### ⚠️ 输出约束
直接输出 Prompt 内容。严禁任何“好的”、“这是为您生成的”等废话。`
                    },
                    {
                        role: "user",
                        content: `请基于以下原始需求，选择最匹配的架构并生成高性能 Prompt：\n\n${originalText}`
                    }
                ],
                temperature: 0.3, 
                max_tokens: 2500,
                top_p: 0.8
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            res.status(200).json({ optimizedText: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "NVIDIA API 响应异常", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "服务器内部错误", message: err.message });
    }
};

