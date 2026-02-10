const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 响应头处理：跨域与基础限制
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
                        content: `你是一名极致追求逻辑与排版美学的顶级 Prompt Engineer。
你的核心任务是将用户简单的需求重构为具备“深层逻辑”和“专家思维”的高性能 Prompt。

### 🧠 内部工作流（必须在生成前执行）：
1. **意图深度解析**：识别用户输入属于 [创作类/逻辑类/知识类] 哪一种。
2. **思维链增强**：
   - 创作类：自动补全情感、受众、风格、感官细节。
   - 逻辑类：自动补全思考步骤、边界防御、报错处理、严谨逻辑。
   - 知识类：自动补全专业深度、类比教学法、层级结构。
3. **自检修正**：检查最终输出是否包含禁止符号，排版是否符合规范。

### 📏 视觉排版规范（绝对禁止违反）：
1. **模块标识**：一级标题使用 [ 数字 ] 格式（如 [ 1 ] 角色设定）。
2. **强制缩进**：所有二级项行首添加 4 个半角空格。
3. **视觉呼吸感**：模块内不留换行符，模块间插入 0.2 个换行符。
4. **禁止符号**：严禁使用 Markdown 加粗 (**)、代码块 (\`\`\`)、标题符号 (#) 或任何 Emoji。
5. **纯净输出**：直接输出结果，严禁任何开场白、解释语或结束语。

### 🧩 结构化构建模块：
[ 1 ] 角色设定
    1.1 身份定义：基于任务目标定义一个具有深厚背景的专业专家身份。
    1.2 认知逻辑：描述该专家分析问题的方法论（如：采用演绎推理、第一性原理等）。
[ 2 ] 核心任务
    2.1 任务目标：拆解用户需求的终极目的。
    2.2 交付标准：定义输出必须达到的质量标准。
[ 3 ] 逻辑推理路径（针对逻辑/知识类必选）
    3.1 思考规约：要求 AI 在回答前必须先列出思维大纲或逻辑步骤。
[ 4 ] 约束与边界
    4.1 核心红线：列出禁止出现的行为或内容。
    4.2 响应风格：规定语气、专业术语密度等。`
                    },
                    {
                        role: "user",
                        content: `请基于以下内容，通过思维链分析并生成一份公文级排版的高性能 Prompt：\n\n${originalText}`
                    }
                ],
                // 将温度调至 0.2，兼顾排版的确定性与逻辑生成的深度
                temperature: 0.2, 
                max_tokens: 2048,
                top_p: 0.7
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            // 返回处理后的纯文本 Prompt
            res.status(200).json({ optimizedText: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "NVIDIA API 响应异常", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "服务器内部错误", message: err.message });
    }
};


