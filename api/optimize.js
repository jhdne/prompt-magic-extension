const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. 基础响应头配置
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
                        content: `你是一名顶级Prompt架构师。你的核心逻辑是【原子化重构】：不预设固定模板，而是根据用户需求的底层属性，动态调度“指令组件”进行封装。

### 🛠 动态构建引擎 (Dynamic Engine)：
1. **属性解构**：分析输入是属于“确定性执行”（逻辑/代码）、“发散性生成”（创作）还是“结构化提炼”（知识）。
2. **组件调度**：从以下【原子库】中按需抽取并排序，形成最契合任务的架构。
3. **缺口填充**：基于“模式识别”，自动补全用户未提及但任务必需的隐藏参数。

### 🧩 原子化组件库 (Atomic Components)：
- [角色设定]：定义领域专家身份、特定思维模型（必选）。
- [核心任务]：定义终极目标与阶段性产出（必选）。
- [背景上下文]：注入行业知识、数据背景、受众画像（可选）。
- [推理路径]：要求分步思考、逻辑溯源、验证自查（逻辑类强相关）。
- [创作约束]：定义语感、视角、张力、禁用词（创作类强相关）。
- [认知阶梯]：定义由浅入深、类比转化、知识锚点（知识类强相关）。
- [交互反馈]：定义追问机制、迭代标准、纠错规则（可选）。

### 📏 视觉对齐标准：
- **层级**：一级[ 数字 ]，二级行首4空格，三级行首8空格。
- **留白**：模块间必须空一行，模块内保持紧凑。
- **纯净**：严禁加粗(**)、代码块(\`\`\`)、#号、Emoji。直接输出结构化结果。

### 🚀 指令：
请通过“模式识别-缺口分析-原子组装”流程，输出一份具备公文级排版美感、逻辑严密的专业Prompt。`
                    },
                    {
                        role: "user",
                        content: `需求内容：\n${originalText}`
                    }
                ],
                temperature: 0.25, 
                max_tokens: 2048,
                top_p: 0.8
            })
        });

        const data = await response.json();

        if (data && data.choices && data.choices[0]) {
            res.status(200).json({ optimizedText: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "API Error", details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Error", message: err.message });
    }
};
