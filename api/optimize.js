const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 处理跨域与请求验证
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { originalText } = req.body || {};
    if (!originalText) return res.status(400).json({ error: "No text provided" });

    try {
        const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

        // 注意：这里使用了您指定的 Gemma-3 模型引擎
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                // 请确保环境变量 NVIDIA_API_KEY 已设置为您的 nvapi-... 密钥
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3n-e2b-it",
                messages: [
                    {
                        role: "system",
                        content: `你是一名极致追求逻辑与排版美学的顶级 Prompt Engineer。
你的核心任务是将用户简单的需求重构为具备“深层逻辑”和“专家思维”的高性能 Prompt。

### 🧠 内部工作流（必须在生成前执行）：
1. **意图深度解析**：识别用户输入属于 [创作类/逻辑类/知识类] 哪一种。
   优先级排序：创作 > 逻辑 > 知识。无法识别时默认逻辑类。
2. **思维链增强**：
   - 创作类：补全情感、受众、风格、感官细节。
   - 逻辑类：补全思考步骤、边界防御、报错处理。
   - 知识类：补全专业深度、类比教学、层级结构。
3. **自检修正**：确保无禁止符号，排版严格缩进。

### 📏 视觉排版规范（绝对禁止违反）：
1. **模块标识**：一级标题使用 [ 数字 ] 格式。
2. **强制缩进**：二级项行首 4 个半角空格，三级项行首 8 个半角空格。
3. **视觉呼吸感**：模块间空一行，模块内不空行。
4. **禁止符号**：严禁使用 **、\`\`\`、#、Emoji、ASCII 装饰线。
5. **纯净输出**：直接输出结果，严禁开场白、解释语或结束语。

### 🧩 结构化构建模块：
[ 1 ] 角色设定
    1.1 身份定义：基于任务目标定义一个具有深厚背景的专业专家身份。
    1.2 认知逻辑：描述该专家分析问题的方法论（如：采用第一性原理等）。
[ 2 ] 核心任务
    2.1 任务目标：将需求转化为高性能 Prompt。
    2.2 交付标准：包含执行路径、明确边界、清晰标准。
[ 3 ] 执行规约（根据意图类型动态生成）
    3.1 预处理流程：定义思考大纲。
    3.2 约束细节：列出具体红线。
[ 4 ] 质量门禁
    4.1 确认全篇不含任何加粗符号或 Emoji。
    4.2 确认身份背景是否具备可验证的专业性。`
                    },
                    {
                        role: "user",
                        content: `请基于以下内容，通过思维链分析并生成一份公文级排版的高性能 Prompt：\n\n${originalText}`
                    }
                ],
                // 针对 Gemma-3 调优的参数
                temperature: 0.25,  // 略微提高温度，增强 Gemma 的专家思维深度
                max_tokens: 2048,   // 确保长 Prompt 不会被截断
                top_p: 0.8,         // 增加采样多样性
                stream: false
            })
        });

        const data = await response.json();

        // 容错处理：检查数据结构是否存在
        if (data && data.choices && data.choices[0]) {
            res.status(200).json({ 
                optimizedText: data.choices[0].message.content,
                modelUsed: "google/gemma-3n-e2b-it"
            });
        } else {
            console.error("API Response Structure Error:", data);
            res.status(500).json({ error: "API 响应结构异常", details: data });
        }
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "服务器内部错误", message: err.message });
    }
};
