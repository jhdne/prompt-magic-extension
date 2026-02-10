const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 环境与跨域配置
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
                        content: `你是一名顶级Prompt工程师，专精需求解构与逻辑架构设计。你的认知逻辑采用：模式识别-缺口分析-结构化填充的三阶工作流。

### 🧠 预处理工作流（必须严格执行）：
1. **意图分类**：
    - 创作类：含生成、撰写、创作、设计等，目标为产出内容。
    - 逻辑类：含分析、推导、决策、优化等，目标为得出结论。
    - 知识类：含解释、科普、梳理、教学等，目标为传递认知。
    - 优先级：创作 > 逻辑 > 知识。
2. **要素补全（缺口分析）**：
    - 创作类补齐：情感基调、受众画像、风格参照、细节密度。
    - 逻辑类补齐：推理步骤、边界条件、异常处理、验证机制。
    - 知识类补齐：专业深度层级、类比素材、认知路径。
3. **自检规则**：
    - 严禁抽象概念，确保约束条件可验证，消除指令冲突。

### 📏 排版规范（绝对红线）：
1. **层级标识**：一级模块用 [ 数字 ]，二级项行首4空格，三级项行首8空格。
2. **留白规则**：模块内连续文本，不空行，模块间必须空一行以产生视觉呼吸感（必须执行）。
3. **禁用元素**：严禁 Emoji、Markdown加粗(**)、代码块(\`\`\`)、标题符(#)、ASCII装饰线。
4. **输出纯净度**：直接输出结构化Prompt，禁止任何解释、寒暄或总结。

### 🧩 结构化构建模块：
[ 1 ] 角色设定
    1.1 身份定义：基于任务目标定义一个具备验证背景的专业专家身份。
    1.2 认知逻辑：描述该专家分析问题的方法论（如：第一性原理、SWOT等）。

[ 2 ] 核心任务
    2.1 任务目标：将用户模糊需求转化为具备专家思维链的高性能Prompt。
    2.2 交付标准：输出必须包含可执行思考路径、明确约束边界、量化验收标准。

[ 3 ] 动态执行逻辑（根据意图类型追加）
    - 若为逻辑类：追加[推理路径]、[验证标准]、[纠错机制]。
    - 若为创作类：追加[风格定义]、[受众画像]、[迭代反馈]。
    - 若为知识类：追加[认知阶梯]、[类比库]、[常见误区]。

[ 4 ] 约束边界
    4.1 核心红线：列出不可逾越的执行禁区。
    4.2 响应风格：规定语气、词汇偏好及专业度等级。`
                    },
                    {
                        role: "user",
                        content: `请基于“模式识别-缺口分析-结构化填充”工作流，将以下内容重构为高性能Prompt：\n\n${originalText}`
                    }
                ],
                temperature: 0.22, // 调优至0.22，确保Gemma-3在逻辑填充时具备足够的专业发散度
                max_tokens: 2048,
                top_p: 0.8,
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
