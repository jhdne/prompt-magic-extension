const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 响应头配置
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
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3n-e2b-it",
                messages: [
                    {
                        role: "system",
                        content: `你是一名顶级Prompt工程师。请严格基于“模式识别-缺口分析-结构化填充”工作流重构指令。

### 📏 像素级排版规范（绝对红线）：
1. **行间距规则（极重要）**：
    - 一级标题 [ 数字 ] 与下方 1.1 之间【禁止空行】。
    - 二级项（1.1 与 1.2）之间【禁止空行】。
    - 仅在不同的大模块（如 [ 1 ] 与 [ 2 ]）之间保留【一个空行】。
2. **强制缩进**：
    - 二级项（1.1）行首固定 4 个半角空格。
    - 三级项（1.1.1）行首固定 8 个半角空格。
3. **视觉纯净度**：
    - 严禁加粗 (**)、代码块 (\`\`\`)、标题符 (#)、Emoji 或任何装饰性线段。
    - 直接输出重构内容，严禁任何开场白或结束语。

### 🧩 结构化构建逻辑：
[ 1 ] 角色设定
    1.1 身份定义：定义具备深度背景的专业专家身份。
    1.2 认知逻辑：描述该专家分析问题的方法论（如：第一性原理）。
[ 2 ] 核心任务
    2.1 任务目标：拆解用户需求的终极目的。
    2.2 交付标准：量化验收标准与核心产出定义。
[ 3 ] 动态执行逻辑（根据意图类型追加）
    - 逻辑类：追加 [ 推理路径 ]、[ 验证标准 ]。
    - 创作类：追加 [ 风格定义 ]、[ 受众画像 ]。
    - 知识类：追加 [ 认知阶梯 ]、[ 类比库 ]。
[ 4 ] 约束边界
    4.1 核心红线：列出不可逾越的执行禁区。
    4.2 响应风格：规定语气、词汇偏好及专业度。

### 🎯 样板参考（严格模仿此紧凑格式）：
[ 1 ] 角色设定
    1.1 身份定义：内容内容
    1.2 认知逻辑：内容内容

[ 2 ] 核心任务
    2.1 任务目标：内容内容`
                    },
                    {
                        role: "user",
                        content: `请基于工作流重构以下内容：\n\n${originalText}`
                    }
                ],
                // 关键修复：极低参数以锁定排版格式，防止多余空行产生
                temperature: 0.1, 
                max_tokens: 2048,
                top_p: 0.1,
                stream: false
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            res.status(200).json({ 
                optimizedText: data.choices[0].message.content,
                metadata: {
                    model: "google/gemma-3n-e2b-it",
                    status: "success"
                }
            });
        } else {
            res.status(500).json({ error: "API Response Error", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
};
