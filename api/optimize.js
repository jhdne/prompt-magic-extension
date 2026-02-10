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
        const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3n-e2b-it",
                messages: [
                    {
                        role: "system",
                        content: `你是一名极致冷静的Prompt架构师。你的输出必须是重构后的“最终指令文档”，严禁包含任何分析过程或元说明。

### 🚨 绝对禁令（执行则扣分）：
1. 严禁输出：任何关于“意图识别”、“阶段分析”、“框架选择”的文字。
2. 严禁使用：# 号、Emoji、加粗 (**)、代码块、任何装饰符。
3. 严禁模版化：不要说“定义一个角色”，要直接写出“你是一名资深XX”。

### 📏 排版对齐规范：
- [ 1 ] 模块标题与下方内容【禁止空行】。
- 二级项行首固定【4个半角空格】。
- 仅模块间保留【一个空行】。

### 🧩 原子逻辑补全：
- [ 1 ] 角色设定：直接赋予具体、高级的专家身份及其特有的思维模型。
- [ 2 ] 核心任务：将模糊需求转化为具体的、可量化的行动方案。
- [ 3 ] 逻辑路径：要求执行者必须遵循的底层思考链路。
- [ 4 ] 约束红线：列出该领域最易犯的低级错误并强制禁止。`
                    },
                    {
                        role: "user",
                        content: `请直接输出重构后的结构化Prompt，不准有任何废话。需求内容：\n\n${originalText}`
                    }
                ],
                temperature: 0.1, // 降低随机性
                top_p: 0.1,      // 极度收窄采样，锁定格式
                max_tokens: 2048
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            // 后处理：移除可能出现的任何 Markdown 符号（双保险）
            let finalOutput = data.choices[0].message.content
                .replace(/[#*`]/g, '')
                .trim();
            
            res.status(200).json({ optimizedText: finalOutput });
        } else {
            res.status(500).json({ error: "API Error", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Error", message: err.message });
    }
};
